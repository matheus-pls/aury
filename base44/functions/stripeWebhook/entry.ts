import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event;
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    const base44 = createClientFromRequest(req);

    console.log("Webhook event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!userEmail || !subscriptionId) {
        console.log("Missing user_email or subscription_id in session");
        return Response.json({ received: true });
      }

      // Buscar detalhes da assinatura
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      // Verificar se já existe
      const existing = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail });

      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "active",
          current_period_end: periodEnd
        });
        console.log("Updated subscription for:", userEmail);
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          user_email: userEmail,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "active",
          plan: "premium",
          current_period_end: periodEnd
        });
        console.log("Created subscription for:", userEmail);
      }
    }

    else if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) return Response.json({ received: true });

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: subscriptionId });
      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: "active",
          current_period_end: periodEnd
        });
        console.log("Renewed subscription:", subscriptionId);
      }
    }

    else if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const newStatus = subscription.status; // active, canceled, past_due, etc.

      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: subscriptionId });
      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: newStatus === "canceled" ? "canceled" : newStatus === "active" ? "active" : "past_due"
        });
        console.log("Updated subscription status to:", newStatus, "for:", subscriptionId);
      }
    }

    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) return Response.json({ received: true });

      const existing = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: subscriptionId });
      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, { status: "past_due" });
        console.log("Payment failed for subscription:", subscriptionId);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});
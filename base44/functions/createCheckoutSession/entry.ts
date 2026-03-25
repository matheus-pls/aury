import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const PRICE_ID = "price_1TEstdLynrHWiwpgliTX5PdR";

Deno.serve(async (req) => {
  try {
    const { user_email, success_url, cancel_url } = await req.json();

    if (!user_email) {
      return Response.json({ error: "user_email is required" }, { status: 400 });
    }

    // Verificar se já tem assinatura ativa
    const base44 = createClientFromRequest(req);
    const existing = await base44.asServiceRole.entities.Subscription.filter({ user_email, status: "active" });
    if (existing && existing.length > 0) {
      return Response.json({ error: "already_subscribed" }, { status: 400 });
    }

    // Criar ou recuperar customer
    let customerId;
    const customers = await stripe.customers.list({ email: user_email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user_email });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: success_url || `${req.headers.get("origin")}/Upgrade?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/Upgrade?canceled=true`,
      metadata: {
        user_email,
        base44_app_id: Deno.env.get("BASE44_APP_ID")
      }
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
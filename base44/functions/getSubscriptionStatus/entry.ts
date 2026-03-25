import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { user_email } = await req.json();

    if (!user_email) {
      return Response.json({ is_premium: false, status: null });
    }

    const base44 = createClientFromRequest(req);
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ user_email });

    const active = subscriptions?.find(s => s.status === "active");

    if (active) {
      // Verificar se expirou
      if (active.current_period_end) {
        const end = new Date(active.current_period_end);
        if (end < new Date()) {
          return Response.json({ is_premium: false, status: "expired" });
        }
      }
      return Response.json({
        is_premium: true,
        status: "active",
        subscription_id: active.stripe_subscription_id,
        current_period_end: active.current_period_end
      });
    }

    return Response.json({ is_premium: false, status: subscriptions?.[0]?.status || null });
  } catch (error) {
    console.error("getSubscriptionStatus error:", error);
    return Response.json({ is_premium: false, status: null, error: error.message });
  }
});
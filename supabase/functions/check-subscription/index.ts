import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LIFETIME_PRICE_ID = "price_1TYMwP4blzRUq4fuIbSkjIw7";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: userData, error: userError } =
      await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(userError.message);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | null = null;
    let subscribed = false;
    let lifetime = false;
    let subscriptionEnd: string | null = null;
    let plan: "monthly" | "lifetime" | null = null;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;

      // Active subscription?
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        subscribed = true;
        plan = "monthly";
        const sub = subs.data[0];
        subscriptionEnd = new Date(
          sub.current_period_end * 1000,
        ).toISOString();
      }

      // Lifetime: look for a paid checkout session for the lifetime price
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 20,
      });
      for (const s of sessions.data) {
        if (s.mode === "payment" && s.payment_status === "paid") {
          const items = await stripe.checkout.sessions.listLineItems(s.id, {
            limit: 5,
          });
          if (items.data.some((li) => li.price?.id === LIFETIME_PRICE_ID)) {
            lifetime = true;
            plan = plan ?? "lifetime";
            break;
          }
        }
      }
    }

    const premium = subscribed || lifetime;

    await supabaseAdmin.from("subscribers").upsert(
      {
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customerId,
        subscribed,
        lifetime,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return new Response(
      JSON.stringify({
        premium,
        plan: lifetime ? "lifetime" : subscribed ? "monthly" : null,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg, premium: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
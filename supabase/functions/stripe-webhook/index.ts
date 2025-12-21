
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const body = await req.text();

    let event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
            undefined,
            cryptoProvider
        );
    } catch (err: any) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Lógica de Processamento
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const plano = session.metadata?.plano;
        const email = session.customer_email;

        if (userId && plano) {
            // Atualiza/Cria a assinatura no banco (Tabela 'subscriptions' ou direto no 'profiles' se preferir simplificar)
            // Para este exemplo robusto, vamos usar a tabela 'subscriptions'
            await supabase.from('subscriptions').upsert({
                user_id: userId,
                email: email,
                plano: plano,
                status: 'active',
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                updated_at: new Date().toISOString()
            });

            // Também atualiza o profile para acesso rápido no client
            await supabase.from('profiles').update({
                plan: plano,
                subscription_date: new Date().toISOString()
            }).eq('id', userId);

            console.log(`Assinatura ativada para: ${email} (${plano})`);
        }
    }

    // Lidar com cancelamentos / falhas de pagamento recorrente (invoice.payment_failed) se necessário
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        // Procura o usuário pelo stripe_subscription_id e cancela
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', subscription.id);

        // Downgrade no profile
        // await supabase.from('profiles').update({ plan: 'free' })... (Lógica opcional, depende se quer manter acesso até o fim do ciclo)
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
    });
});

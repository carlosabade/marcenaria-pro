
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // 0. Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Iniciando create-checkout...");

        // 1. Verificação de Variáveis de Ambiente (DEBUG)
        const envVars = [
            "STRIPE_SECRET_KEY",
            "STRIPE_PRICE_MONTHLY",
            "STRIPE_PRICE_QUARTERLY",
            "STRIPE_PRICE_LIFETIME",
            "FRONTEND_URL",
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY"
        ];

        const missingVars = envVars.filter(key => !Deno.env.get(key));
        if (missingVars.length > 0) {
            console.error("Variáveis faltando:", missingVars);
            throw new Error(`Configuração incompleta no servidor. Faltam: ${missingVars.join(", ")}`);
        }

        // 2. Inicializar Stripe
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
            apiVersion: "2022-11-15",
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 3. Validar Usuário Logado
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            console.error("Erro de Auth:", authError);
            throw new Error("Usuário não autenticado.");
        }

        // 4. Receber dados do corpo
        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error("Corpo da requisição inválido (JSON esperado).");
        }

        const { plano } = body;
        console.log(`Processando plano: ${plano} para usuário ${user.email}`);

        // 5. Mapear Preços
        const PRICE_MAP: Record<string, string | undefined> = {
            monthly: Deno.env.get("STRIPE_PRICE_MONTHLY"),
            quarterly: Deno.env.get("STRIPE_PRICE_QUARTERLY"),
            lifetime: Deno.env.get("STRIPE_PRICE_LIFETIME"),
        };

        const priceId = PRICE_MAP[plano];
        if (!plano || !priceId) {
            throw new Error(`Plano '${plano}' inválido ou sem ID de preço configurado.`);
        }

        const isSubscription = plano !== 'lifetime';

        // 6. Criar Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // Removido boleto temporariamente para simplificar
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: isSubscription ? "subscription" : "payment",
            success_url: `${Deno.env.get("FRONTEND_URL")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${Deno.env.get("FRONTEND_URL")}/pricing`,
            customer_email: user.email,
            metadata: {
                user_id: user.id,
                plano: plano
            },
        });

        console.log("Checkout criado com sucesso:", session.url);

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error("Erro Fatal no Edge Function:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400, // Retorna 400 para erros lógicos, evitando 500
            }
        );
    }
});

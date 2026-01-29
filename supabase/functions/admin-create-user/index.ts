import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-id, x-admin-secret',
            }
        })
    }

    try {
        const adminSecretHeader = req.headers.get("x-admin-secret");

        // Check if the request is from our authorized admin frontend
        if (!adminSecretHeader || adminSecretHeader !== ADMIN_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const { email, role, department, full_name } = await req.json();

        if (!email || !role) {
            return new Response(JSON.stringify({ error: "Missing required fields (email/role)" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ==========================
        // CREATE USER INVITE (AUTH)
        // ==========================
        const { data: inviteData, error: inviteError } =
            await supabase.auth.admin.inviteUserByEmail(email, {
                data: { full_name: full_name || email.split('@')[0] }
            });

        if (inviteError) {
            return new Response(JSON.stringify(inviteError), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const user = inviteData.user;

        // ==========================
        // CREATE PROFILE (PUBLIC)
        // ==========================
        const { error: profileError } = await supabase.from("user_profiles").insert({
            id: user.id,
            email: user.email,
            full_name: full_name || user.email.split('@')[0],
            role,
            department,
            status: "invited"
        });

        if (profileError) {
            console.error("Profile creation error:", profileError);
        }

        // ==========================
        // AUDIT LOG
        // ==========================
        const adminId = req.headers.get("x-admin-id");

        await supabase.from("audit_logs").insert({
            admin_id: adminId,
            action: "INVITE_USER",
            target_user: user.id,
            metadata: { email, role, department, full_name }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Enterprise invite sent successfully",
            user_id: user.id
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Get the User's JWT from the request
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            throw new Error("Missing auth token");
        }

        // 2. Create a client with the USER'S token to check their identity
        const userClient = createClient(
            SUPABASE_URL,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        // 3. Verify the user is real
        const { data: { user }, error: userError } = await userClient.auth.getUser();
        if (userError || !user) {
            throw new Error("Invalid user token");
        }

        // 4. Create an Admin Client (Service Role) for database lookup & invite
        // We use this to look up the role because standard users might not have read access to everyone's role depending on strict RLS.
        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        // 5. SECURITY CHECK: Is this user an Admin?
        const { data: profile } = await supabaseAdmin
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            return new Response(JSON.stringify({ error: "Unauthorized: Admins only" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 6. Perform the Invite
        const { email, role = "team", department = "General", full_name } = await req.json();

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { full_name: full_name || email.split('@')[0] }
        });

        if (inviteError) {
            throw inviteError;
        }

        // 7. Create Profile for the new user
        const newUser = inviteData.user;
        await supabaseAdmin.from("user_profiles").insert({
            id: newUser.id,
            email: newUser.email,
            full_name: full_name || newUser.email?.split('@')[0],
            role,
            department,
            status: "invited"
        });

        // 8. Log it (Audit Trail)
        await supabaseAdmin.from("audit_logs").insert({
            admin_id: user.id,
            action: "INVITE_USER",
            target_user: newUser.id,
            metadata: { email, role, department }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "User invited successfully",
            user: newUser
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

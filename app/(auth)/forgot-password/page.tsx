"use client";

import { useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { createClient } from "@supabase/supabase-js";
import { authErrorText } from "@/lib/auth-errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function send() {
    setLoading(true);
    setError("");
    // Sengaja flow implicit, bukan PKCE bawaan @supabase/ssr. Link PKCE butuh cookie code verifier
    // dari browser yang minta, jadi gagal kalau dibuka di app email atau perangkat lain. Implicit
    // bawa token di hash URL, lalu /reset-password yang pasang sesinya. (Pola token_hash butuh SMTP sendiri.)
    const implicit = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { flowType: "implicit", persistSession: false },
    });
    const { error } = await implicit.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(authErrorText(error));
    setSent(true);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <Form
        header={<Header variant="h1">Lupa password</Header>}
        errorText={error}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button href="/login" variant="link">
              Kembali ke login
            </Button>
            <Button variant="primary" loading={loading} disabled={sent}>
              Kirim link reset
            </Button>
          </SpaceBetween>
        }
      >
        <Container>
          <SpaceBetween size="m">
            {sent ? (
              // Sengaja nggak bilang email-nya terdaftar atau nggak.
              <Alert type="success">
                Kalau email itu terdaftar, link reset password udah dikirim. Cek inbox (dan folder spam). <Link href="/login">Kembali ke login</Link>
              </Alert>
            ) : (
              <FormField label="Email" description="Kami kirim link buat bikin password baru.">
                <Input type="email" autoComplete="username" value={email} onChange={({ detail }) => setEmail(detail.value)} />
              </FormField>
            )}
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
}

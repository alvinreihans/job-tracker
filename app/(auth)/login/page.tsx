"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { createClient } from "@/lib/supabase/client";
import { authErrorText } from "@/lib/auth-errors";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const linkError = useSearchParams().get("error") === "link";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"login" | "signup" | null>(null);
  const [error, setError] = useState(
    linkError
      ? "Link konfirmasi nggak bisa dipakai di browser ini (atau udah kedaluwarsa). Kalau barusan daftar, email kamu biasanya udah terkonfirmasi, jadi coba login aja."
      : "",
  );
  const [info, setInfo] = useState("");

  async function login() {
    setLoading("login");
    setError("");
    setInfo("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(null);
    if (error) return setError(authErrorText(error));
    router.replace("/");
    router.refresh();
  }

  async function signup() {
    setLoading("signup");
    setError("");
    setInfo("");
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/` },
    });
    setLoading(null);
    if (error) return setError(authErrorText(error));
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }
    setInfo("Akun dibuat. Cek email kamu dan klik link konfirmasi untuk mulai.");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login();
      }}
    >
      <Form
        header={<Header variant="h1" description="Catatan lamaran kerja kamu">Job Tracker</Header>}
        errorText={error}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button formAction="none" onClick={signup} loading={loading === "signup"} disabled={!!loading}>
              Daftar
            </Button>
            <Button variant="primary" loading={loading === "login"} disabled={!!loading}>
              Masuk
            </Button>
          </SpaceBetween>
        }
      >
        <Container>
          <SpaceBetween size="m">
            {info ? <Alert type="success">{info}</Alert> : null}
            <FormField label="Email">
              <Input type="email" autoComplete="username" value={email} onChange={({ detail }) => setEmail(detail.value)} />
            </FormField>
            <FormField label="Password">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={({ detail }) => setPassword(detail.value)}
              />
            </FormField>
            <Checkbox checked={showPassword} onChange={({ detail }) => setShowPassword(detail.checked)}>
              Tampilkan password
            </Checkbox>
            <Link href="/forgot-password">Lupa password?</Link>
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { createClient } from "@/lib/supabase/client";
import { authErrorText } from "@/lib/auth-errors";

// Link reset (flow implicit, lihat /forgot-password) datang tanpa cookie sesi dan bawa token di hash URL.
// Makanya halaman ini publik di proxy.ts dan sesinya dipasang sendiri di sini.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Tombol simpan nggak di-disable (pola Cloudscape), error baru muncul setelah coba simpan.
  const [submitted, setSubmitted] = useState(false);
  const passwordError = submitted && !password ? "Password baru wajib diisi." : undefined;
  const confirmError = (submitted || confirm !== "") && confirm !== password ? "Password nggak sama." : undefined;

  useEffect(() => {
    const supabase = createClient();
    const hash = new URLSearchParams(location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");

    const session =
      access_token && refresh_token
        ? supabase.auth.setSession({ access_token, refresh_token }).then(({ data }) => {
            // Jangan tinggalkan token di address bar atau riwayat browser.
            history.replaceState(null, "", location.pathname);
            return !!data.user;
          })
        : // Tanpa token: link kedaluwarsa (Supabase taruh #error=... di hash) atau halaman dibuka langsung.
          supabase.auth.getUser().then(({ data }) => !!data.user);

    session.then(setHasSession);
  }, []);

  async function save() {
    setSubmitted(true);
    if (!password || password !== confirm) return;
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(authErrorText(error));
    router.replace("/");
    router.refresh();
  }

  if (hasSession === false) {
    return (
      <Alert
        type="error"
        header="Link reset nggak berlaku"
        action={<Button href="/forgot-password">Minta link baru</Button>}
      >
        Link reset cuma bisa dipakai sekali dan berlaku 1 jam.
      </Alert>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Form
        header={<Header variant="h1">Bikin password baru</Header>}
        errorText={error}
        actions={
          // Loading sampai sesi terpasang, kalau nggak updateUser gagal "Auth session missing".
          <Button variant="primary" loading={loading || hasSession === null}>
            Simpan password
          </Button>
        }
      >
        <Container>
          <SpaceBetween size="m">
            <FormField label="Password baru" constraintText="Minimal 6 karakter." errorText={passwordError}>
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={({ detail }) => setPassword(detail.value)}
              />
            </FormField>
            <FormField label="Ulangi password baru" errorText={confirmError}>
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={({ detail }) => setConfirm(detail.value)}
              />
            </FormField>
            <Checkbox checked={showPassword} onChange={({ detail }) => setShowPassword(detail.checked)}>
              Tampilkan password
            </Checkbox>
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  );
}

import type { AuthError } from "@supabase/supabase-js";

// Pesan Supabase berbahasa Inggris, jadi yang umum diterjemahkan dan sisanya ditampilkan apa adanya.
export function authErrorText(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email atau password salah.";
    case "email_not_confirmed":
      return "Email belum dikonfirmasi. Cek inbox kamu.";
    case "weak_password":
      return "Password terlalu lemah (minimal 6 karakter).";
    case "same_password":
      return "Password baru harus beda dari yang lama.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
    default:
      return error.message;
  }
}

"use client";

import { useSyncExternalStore } from "react";
import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.id";

const subscribe = () => () => {};

export default function Providers({ children }: { children: React.ReactNode }) {
  // Cloudscape ngukur DOM waktu render (lebar scrollbar, visual refresh), jadi hasil SSR
  // selalu beda sama client → hydration mismatch. Render UI-nya cuma di client.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  // HTML polos (bukan Cloudscape) biar server & render pertama client sama, dan layar nggak putih kosong.
  if (!mounted)
    return (
      <p role="status" style={{ margin: 0, padding: 20 }}>
        Memuat…
      </p>
    );

  return (
    <I18nProvider locale="id" messages={[messages]}>
      {children}
    </I18nProvider>
  );
}

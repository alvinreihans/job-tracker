"use client";

import { useSyncExternalStore } from "react";
import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.id";

const subscribe = () => () => {};

export default function Providers({ children }: { children: React.ReactNode }) {
  // Cloudscape ngukur DOM waktu render (lebar scrollbar, visual refresh), jadi hasil SSR
  // selalu beda sama client → hydration mismatch. Render UI-nya cuma di client.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return null;

  return (
    <I18nProvider locale="id" messages={[messages]}>
      {children}
    </I18nProvider>
  );
}

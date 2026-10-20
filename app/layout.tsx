import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Catatan lamaran kerja",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

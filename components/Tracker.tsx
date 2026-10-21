"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { createClient } from "@/lib/supabase/client";

export default function Tracker({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <div id="top-nav" style={{ position: "sticky", top: 0, zIndex: 1002 }}>
        <TopNavigation
          identity={{ href: "/", title: "Job Tracker" }}
          utilities={[
            {
              type: "menu-dropdown",
              text: email,
              iconName: "user-profile",
              items: [{ id: "logout", text: "Keluar" }],
              onItemClick: ({ detail }) => detail.id === "logout" && logout(),
            },
          ]}
        />
      </div>
      <AppLayout
        headerSelector="#top-nav"
        navigationHide
        toolsHide
        content={
          // Isi tabel asli menyusul di T6.
          <Table header={<Header>Lamaran</Header>} items={[]} columnDefinitions={[]} empty="Belum ada lamaran." />
        }
      />
    </>
  );
}

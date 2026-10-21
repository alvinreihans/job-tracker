"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollection } from "@cloudscape-design/collection-hooks";
import AppLayout from "@cloudscape-design/components/app-layout";
import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";
import Pagination from "@cloudscape-design/components/pagination";
import SplitPanel from "@cloudscape-design/components/split-panel";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table, { type TableProps } from "@cloudscape-design/components/table";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { createClient } from "@/lib/supabase/client";
import { STATUS_INDICATOR, type Application } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import ApplicationDetail from "./ApplicationDetail";

const COLUMNS: TableProps.ColumnDefinition<Application>[] = [
  { id: "company", header: "Perusahaan", cell: (r) => r.company, sortingField: "company" },
  { id: "position", header: "Posisi", cell: (r) => r.position, sortingField: "position" },
  { id: "applied_at", header: "Tanggal lamar", cell: (r) => formatDate(r.applied_at), sortingField: "applied_at" },
  { id: "source", header: "Platform", cell: (r) => r.source, sortingField: "source" },
  { id: "location", header: "Lokasi", cell: (r) => r.location || "-" },
  {
    id: "status",
    header: "Status",
    cell: (r) => <StatusIndicator type={STATUS_INDICATOR[r.status]}>{r.status}</StatusIndicator>,
    sortingField: "status",
  },
];

export default function Tracker({ email, rows }: { email: string; rows: Application[] }) {
  const router = useRouter();
  // Simpan id, bukan objeknya, biar detail ikut data terbaru setelah router.refresh().
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const { items, collectionProps, paginationProps } = useCollection(rows, {
    sorting: { defaultState: { sortingColumn: COLUMNS[2], isDescending: true } },
    pagination: { pageSize: 20 },
  });

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
        splitPanelOpen={!!selected}
        onSplitPanelToggle={({ detail }) => !detail.open && setSelectedId(null)}
        // Di layar sempit (HP) Cloudscape otomatis pindahin panel ke bawah.
        splitPanelPreferences={{ position: "side" }}
        splitPanel={
          selected ? (
            <SplitPanel header={selected.company} closeBehavior="hide" hidePreferencesButton>
              <ApplicationDetail app={selected} />
            </SplitPanel>
          ) : undefined
        }
        content={
          <Table
            {...collectionProps}
            variant="full-page"
            stickyHeader
            trackBy="id"
            items={items}
            columnDefinitions={COLUMNS}
            selectionType="single"
            selectedItems={selected ? [selected] : []}
            onSelectionChange={({ detail }) => setSelectedId(detail.selectedItems[0]?.id ?? null)}
            onRowClick={({ detail }) => setSelectedId(detail.item.id)}
            ariaLabels={{
              itemSelectionLabel: (_, r) => `${r.company} – ${r.position}`,
              selectionGroupLabel: "Pilih lamaran",
            }}
            header={
              <Header variant="awsui-h1-sticky" counter={`(${rows.length})`}>
                Lamaran
              </Header>
            }
            empty={
              <Box textAlign="center" color="inherit">
                <b>Belum ada lamaran</b>
              </Box>
            }
            pagination={<Pagination {...paginationProps} />}
          />
        }
      />
    </>
  );
}

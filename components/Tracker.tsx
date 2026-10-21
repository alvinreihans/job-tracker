"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollection } from "@cloudscape-design/collection-hooks";
import AppLayout from "@cloudscape-design/components/app-layout";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Flashbar, { type FlashbarProps } from "@cloudscape-design/components/flashbar";
import Header from "@cloudscape-design/components/header";
import Modal from "@cloudscape-design/components/modal";
import Pagination from "@cloudscape-design/components/pagination";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import SplitPanel from "@cloudscape-design/components/split-panel";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table, { type TableProps } from "@cloudscape-design/components/table";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { deleteApplication, updateStatus } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { STATUSES, STATUS_INDICATOR, type Application } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import ApplicationDetail from "./ApplicationDetail";
import ApplicationModal from "./ApplicationModal";

const STATUS_OPTIONS = STATUSES.map((value) => ({ value }));

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
    editConfig: {
      ariaLabel: "Status",
      editIconAriaLabel: "bisa diedit",
      editingCell: (item, { currentValue, setValue }) => (
        <Select
          autoFocus
          expandToViewport
          selectedOption={{ value: currentValue ?? item.status }}
          onChange={({ detail }) => setValue(detail.selectedOption.value)}
          options={STATUS_OPTIONS}
        />
      ),
    },
  },
];

export default function Tracker({ email, rows }: { email: string; rows: Application[] }) {
  const router = useRouter();
  // Simpan id, bukan objeknya, biar detail ikut data terbaru setelah refresh().
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const [editing, setEditing] = useState<Application | "new" | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [flash, setFlash] = useState<FlashbarProps.MessageDefinition[]>([]);

  const { items, collectionProps, paginationProps } = useCollection(rows, {
    sorting: { defaultState: { sortingColumn: COLUMNS[2], isDescending: true } },
    pagination: { pageSize: 20 },
  });

  function notify(type: FlashbarProps.Type, content: string) {
    const id = String(Date.now());
    setFlash([{ id, type, content, dismissible: true, onDismiss: () => setFlash((f) => f.filter((m) => m.id !== id)) }]);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteApplication(deleting.id);
    setDeletePending(false);
    if (!result.ok) return notify("error", result.error);
    if (selectedId === deleting.id) setSelectedId(null);
    notify("success", `Lamaran ${deleting.company} dihapus.`);
    setDeleting(null);
  }

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const addButton = (
    <Button variant="primary" iconName="add-plus" onClick={() => setEditing("new")}>
      Tambah lamaran
    </Button>
  );

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
        notifications={<Flashbar items={flash} />}
        splitPanelOpen={!!selected}
        onSplitPanelToggle={({ detail }) => !detail.open && setSelectedId(null)}
        // Di layar sempit (HP) Cloudscape otomatis pindahin panel ke bawah.
        splitPanelPreferences={{ position: "side" }}
        splitPanel={
          selected ? (
            <SplitPanel
              header={selected.company}
              closeBehavior="hide"
              hidePreferencesButton
              headerActions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => setEditing(selected)}>Edit</Button>
                  <Button onClick={() => setDeleting(selected)}>Hapus</Button>
                </SpaceBetween>
              }
            >
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
            submitEdit={async (item, _column, value) => {
              const result = await updateStatus(item.id, value);
              // Throw biar Cloudscape tetap di mode edit; pesannya lewat Flashbar.
              if (!result.ok) {
                notify("error", result.error);
                throw new Error(result.error);
              }
            }}
            ariaLabels={{
              itemSelectionLabel: (_, r) => `${r.company} – ${r.position}`,
              selectionGroupLabel: "Pilih lamaran",
              activateEditLabel: (column, item) => `Edit ${column.header} ${item.company}`,
              cancelEditLabel: () => "Batal",
              submitEditLabel: () => "Simpan",
              submittingEditText: () => "Menyimpan",
              successfulEditLabel: () => "Tersimpan",
            }}
            header={
              <Header variant="awsui-h1-sticky" counter={`(${rows.length})`} actions={addButton}>
                Lamaran
              </Header>
            }
            empty={
              <Box textAlign="center" color="inherit">
                <SpaceBetween size="m">
                  <b>Belum ada lamaran</b>
                  {addButton}
                </SpaceBetween>
              </Box>
            }
            pagination={<Pagination {...paginationProps} />}
          />
        }
      />

      {editing ? (
        <ApplicationModal
          key={editing === "new" ? "new" : editing.id}
          app={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            notify("success", editing === "new" ? "Lamaran ditambahkan." : "Perubahan disimpan.");
            setEditing(null);
            setSelectedId(id);
          }}
        />
      ) : null}

      <Modal
        visible={!!deleting}
        onDismiss={() => setDeleting(null)}
        header="Hapus lamaran?"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleting(null)} disabled={deletePending}>
                Batal
              </Button>
              <Button variant="primary" onClick={confirmDelete} loading={deletePending}>
                Hapus
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        Lamaran <b>{deleting?.position}</b> di <b>{deleting?.company}</b> bakal dihapus permanen.
      </Modal>
    </>
  );
}

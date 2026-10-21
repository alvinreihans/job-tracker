"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollection } from "@cloudscape-design/collection-hooks";
import AppLayout, { type AppLayoutProps } from "@cloudscape-design/components/app-layout";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Flashbar, { type FlashbarProps } from "@cloudscape-design/components/flashbar";
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Link from "@cloudscape-design/components/link";
import Modal from "@cloudscape-design/components/modal";
import Pagination from "@cloudscape-design/components/pagination";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import SplitPanel from "@cloudscape-design/components/split-panel";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table, { type TableProps } from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { deleteApplication } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { SOURCES, STATUSES, STATUS_INDICATOR, type Application } from "@/lib/constants";
import { countByStatus, matches } from "@/lib/filter";
import { formatDate } from "@/lib/format";
import ApplicationDetail from "./ApplicationDetail";
import ApplicationModal from "./ApplicationModal";

const ALL_STATUS = { value: "", label: "Semua status" };
const ALL_SOURCE = { value: "", label: "Semua platform" };
const STATUS_FILTER_OPTIONS = [ALL_STATUS, ...STATUSES.map((value) => ({ value }))];
const SOURCE_FILTER_OPTIONS = [ALL_SOURCE, ...SOURCES.map((value) => ({ value }))];

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
  // Simpan id, bukan objeknya, biar detail ikut data terbaru setelah refresh().
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const [editing, setEditing] = useState<Application | "new" | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [flash, setFlash] = useState<FlashbarProps.MessageDefinition[]>([]);
  // Panel di samping; user bisa pindah ke bawah lewat tombol preferensi panel. Di HP otomatis di bawah.
  const [splitPanelPrefs, setSplitPanelPrefs] = useState<AppLayoutProps.SplitPanelPreferences>({ position: "side" });
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const counts = countByStatus(rows);

  const addButton = (
    <Button variant="primary" iconName="add-plus" onClick={() => setEditing("new")}>
      Tambah lamaran
    </Button>
  );

  // processItems jalan tiap render, jadi filteringFunction bisa baca status/source dari state.
  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(rows, {
    filtering: {
      filteringFunction: (item, text) => matches(item, { text, status, source }),
    },
    sorting: { defaultState: { sortingColumn: COLUMNS[2], isDescending: true } },
    pagination: { pageSize: 20 },
  });
  const filtered = !!(filterProps.filteringText || status || source);

  function filterStatus(value: string) {
    setStatus(value);
    actions.setCurrentPage(1);
  }

  function filterSource(value: string) {
    setSource(value);
    actions.setCurrentPage(1);
  }

  function clearFilters() {
    actions.setFiltering("");
    setStatus("");
    setSource("");
  }

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
        splitPanelPreferences={splitPanelPrefs}
        onSplitPanelPreferencesChange={({ detail }) => setSplitPanelPrefs(detail)}
        splitPanel={
          selected ? (
            <SplitPanel
              header={selected.company}
              closeBehavior="hide"
            >
              {/* Aksi di isi panel, bukan headerActions: headerActions nggak bisa wrap, jadi judul kegencet di panel samping. */}
              <ApplicationDetail
                app={selected}
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button iconName="edit" onClick={() => setEditing(selected)}>
                      Edit
                    </Button>
                    <Button iconName="remove" onClick={() => setDeleting(selected)}>
                      Hapus
                    </Button>
                  </SpaceBetween>
                }
              />
            </SplitPanel>
          ) : undefined
        }
        content={
          <ContentLayout
            header={
              <Header variant="h1" description="Semua lamaran kerja kamu di satu tempat." actions={addButton}>
                Lamaran
              </Header>
            }
          >
            <SpaceBetween size="l">
              <Container header={<Header variant="h2" description="Klik angka buat filter tabel ke status itu.">Ringkasan status</Header>}>
                <KeyValuePairs
                  columns={4}
                  minColumnWidth={120}
                  items={STATUSES.map((s) => ({
                    label: s,
                    value: (
                      <Link variant="awsui-value-large" onFollow={() => filterStatus(s)} ariaLabel={`${counts[s]} lamaran ${s}, filter`}>
                        {counts[s]}
                      </Link>
                    ),
                  }))}
                />
              </Container>
              <Table
                {...collectionProps}
                variant="container"
                trackBy="id"
                stickyColumns={{ first: 1 }}
                empty={
                  <Box textAlign="center" color="inherit">
                    <SpaceBetween size="m">
                      {rows.length ? (
                        <>
                          <b>Nggak ada lamaran yang cocok</b>
                          <Button onClick={clearFilters}>Hapus filter</Button>
                        </>
                      ) : (
                        <>
                          <b>Belum ada lamaran</b>
                          {addButton}
                        </>
                      )}
                    </SpaceBetween>
                  </Box>
                }
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
                  <Header
                    variant="h2"
                    counter={filtered ? `(${filteredItemsCount}/${rows.length})` : `(${rows.length})`}
                  >
                    Daftar lamaran
                  </Header>
                }
                filter={
                  <Grid
                    gridDefinition={[
                      { colspan: { default: 12, m: 6 } },
                      { colspan: { default: 12, xs: 6, m: 3 } },
                      { colspan: { default: 12, xs: 6, m: 3 } },
                    ]}
                  >
                    <TextFilter
                      {...filterProps}
                      filteringPlaceholder="Cari perusahaan / posisi"
                      filteringAriaLabel="Cari perusahaan atau posisi"
                      countText={filtered ? `${filteredItemsCount} hasil` : undefined}
                    />
                    <Select
                      selectedOption={status ? { value: status } : ALL_STATUS}
                      onChange={({ detail }) => filterStatus(detail.selectedOption.value ?? "")}
                      options={STATUS_FILTER_OPTIONS}
                      ariaLabel="Filter status"
                    />
                    <Select
                      selectedOption={source ? { value: source } : ALL_SOURCE}
                      onChange={({ detail }) => filterSource(detail.selectedOption.value ?? "")}
                      options={SOURCE_FILTER_OPTIONS}
                      ariaLabel="Filter platform"
                    />
                  </Grid>
                }
                pagination={<Pagination {...paginationProps} />}
              />
            </SpaceBetween>
          </ContentLayout>
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

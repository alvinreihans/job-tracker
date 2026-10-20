"use client";

// Spike T1: buktikan Cloudscape jalan di App Router. Diganti di T6.
import { useState } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import DatePicker from "@cloudscape-design/components/date-picker";
import FormField from "@cloudscape-design/components/form-field";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Pagination from "@cloudscape-design/components/pagination";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

const rows = [
  { company: "PT Contoh", position: "Fullstack Developer", status: "Applied" },
  { company: "PT Lain", position: "Backend Developer", status: "Interview HR" },
];
const options = [{ value: "Applied" }, { value: "Seen" }];

export default function Page() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SelectProps.Option | null>(null);
  const [date, setDate] = useState("");

  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <>
          <Table
            header={<Header actions={<Button onClick={() => setOpen(true)}>Buka modal</Button>}>Spike</Header>}
            items={rows}
            columnDefinitions={[
              { id: "company", header: "Perusahaan", cell: (r) => r.company },
              { id: "position", header: "Posisi", cell: (r) => r.position },
              { id: "status", header: "Status", cell: (r) => <StatusIndicator type="info">{r.status}</StatusIndicator> },
            ]}
            pagination={<Pagination currentPageIndex={1} pagesCount={3} />}
          />
          <Modal visible={open} onDismiss={() => setOpen(false)} header="Modal">
            <SpaceBetween size="m">
              <FormField label="Status">
                <Select selectedOption={status} onChange={(e) => setStatus(e.detail.selectedOption)} options={options} />
              </FormField>
              <FormField label="Tanggal">
                <DatePicker value={date} onChange={(e) => setDate(e.detail.value)} placeholder="YYYY/MM/DD" />
              </FormField>
            </SpaceBetween>
          </Modal>
        </>
      }
    />
  );
}

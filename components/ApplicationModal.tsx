"use client";

import { useState } from "react";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import DatePicker from "@cloudscape-design/components/date-picker";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Modal from "@cloudscape-design/components/modal";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Textarea from "@cloudscape-design/components/textarea";
import { saveApplication } from "@/app/actions";
import { SOURCES, STATUSES, type Application } from "@/lib/constants";
import { todayIso } from "@/lib/format";
import type { ApplicationInput, FieldErrors } from "@/lib/validate";

type Draft = Record<keyof ApplicationInput, string>;

// Pola Cloudscape: yang ditandai cuma field opsional (label + "- optional" miring), tanpa asterisk.
const optional = (label: string) => (
  <>
    {label} <i>- opsional</i>
  </>
);

const SOURCE_OPTIONS = SOURCES.map((value) => ({ value }));
const STATUS_OPTIONS = STATUSES.map((value) => ({ value }));

function toDraft(app: Application | null): Draft {
  return {
    company: app?.company ?? "",
    position: app?.position ?? "",
    applied_at: app?.applied_at ?? todayIso(),
    job_url: app?.job_url ?? "",
    location: app?.location ?? "",
    source: app?.source ?? "",
    status: app?.status ?? "Applied",
    notes: app?.notes ?? "",
    responsibilities: app?.responsibilities ?? "",
    requirements: app?.requirements ?? "",
  };
}

// Di-mount ulang tiap dibuka (pakai `key` dari parent), jadi draft selalu mulai dari data terbaru.
export default function ApplicationModal({
  app,
  onClose,
  onSaved,
}: {
  app: Application | null; // null = tambah baru
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [draft, setDraft] = useState(() => toDraft(app));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Error field hilang begitu field-nya diubah. Kalau semua udah beres, error form ikut hilang.
  const set = (key: keyof Draft) => (value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (!fieldErrors[key]) return;
    const rest = { ...fieldErrors };
    delete rest[key];
    setFieldErrors(rest);
    if (!Object.keys(rest).length) setError("");
  };

  async function save() {
    setSaving(true);
    setError("");
    const result = await saveApplication(draft, app?.id);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    onSaved(result.id);
  }

  const text = (key: keyof Draft, label: React.ReactNode, extra?: { type?: "url"; placeholder?: string }) => (
    <FormField label={label} errorText={fieldErrors[key]}>
      <Input value={draft[key]} onChange={({ detail }) => set(key)(detail.value)} {...extra} />
    </FormField>
  );

  const points = (key: "responsibilities" | "requirements", label: React.ReactNode) => (
    <FormField label={label} description="Copy-paste dari lowongan, satu poin per baris." errorText={fieldErrors[key]}>
      <Textarea rows={8} value={draft[key]} onChange={({ detail }) => set(key)(detail.value)} />
    </FormField>
  );

  return (
    <Modal
      visible
      size="large"
      onDismiss={onClose}
      header={app ? "Edit lamaran" : "Tambah lamaran"}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" onClick={save} loading={saving}>
              Simpan
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form errorText={error}>
        <SpaceBetween size="m">
          <ColumnLayout columns={2}>
            {text("company", "Nama perusahaan")}
            {text("position", "Posisi")}
            <FormField label="Tanggal lamar" errorText={fieldErrors.applied_at}>
              <DatePicker
                value={draft.applied_at}
                onChange={({ detail }) => set("applied_at")(detail.value)}
                placeholder="YYYY/MM/DD"
              />
            </FormField>
            {text("location", optional("Lokasi"))}
            <FormField label="Melamar lewat" errorText={fieldErrors.source}>
              <Select
                selectedOption={draft.source ? { value: draft.source } : null}
                onChange={({ detail }) => set("source")(detail.selectedOption.value ?? "")}
                options={SOURCE_OPTIONS}
                placeholder="Pilih platform"
              />
            </FormField>
            <FormField label="Status" errorText={fieldErrors.status}>
              <Select
                selectedOption={{ value: draft.status }}
                onChange={({ detail }) => set("status")(detail.selectedOption.value ?? "")}
                options={STATUS_OPTIONS}
              />
            </FormField>
          </ColumnLayout>
          {text("job_url", optional("Link lowongan"), { type: "url", placeholder: "https://..." })}
          <FormField label={optional("Catatan")} errorText={fieldErrors.notes}>
            <Textarea rows={2} value={draft.notes} onChange={({ detail }) => set("notes")(detail.value)} />
          </FormField>
          <ColumnLayout columns={2}>
            {points("responsibilities", optional("Responsibilities"))}
            {points("requirements", optional("Requirements"))}
          </ColumnLayout>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

"use client";

import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { STATUS_INDICATOR, type Application } from "@/lib/constants";
import { formatDate, toPoints } from "@/lib/format";

export default function ApplicationDetail({ app, actions }: { app: Application; actions?: React.ReactNode }) {
  return (
    <SpaceBetween size="l">
      {actions}
      <KeyValuePairs
        columns={3}
        minColumnWidth={150}
        items={[
          { label: "Posisi", value: app.position },
          { label: "Tanggal lamar", value: formatDate(app.applied_at) },
          { label: "Status", value: <StatusIndicator type={STATUS_INDICATOR[app.status]}>{app.status}</StatusIndicator> },
          { label: "Platform", value: app.source },
          { label: "Lokasi", value: app.location || "-" },
          {
            label: "Link lowongan",
            // Cuma http(s): URL lain (mis. javascript:) nggak dirender jadi link.
            value:
              app.job_url && /^https?:\/\//i.test(app.job_url) ? (
                <Link href={app.job_url} external>
                  Buka lowongan
                </Link>
              ) : (
                app.job_url || "-"
              ),
          },
          { label: "Catatan", value: <span style={{ whiteSpace: "pre-wrap" }}>{app.notes || "-"}</span> },
        ]}
      />
      <ColumnLayout columns={2} minColumnWidth={240}>
        <Points title="Responsibilities" text={app.responsibilities} />
        <Points title="Requirements" text={app.requirements} />
      </ColumnLayout>
    </SpaceBetween>
  );
}

function Points({ title, text }: { title: string; text: string | null }) {
  const points = toPoints(text);
  return (
    <SpaceBetween size="xs">
      <Header variant="h3">{title}</Header>
      {points.length ? (
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      ) : (
        <Box color="text-status-inactive">Belum diisi.</Box>
      )}
    </SpaceBetween>
  );
}

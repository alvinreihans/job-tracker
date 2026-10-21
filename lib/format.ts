// Bullet/nomor yang sering ikut ke-copy dari halaman lowongan: "• ", "- ", "* ", "– ", "1. ", "2) ".
const BULLET = /^(?:[•*–—·▪●◦]\s*|-\s+|\d+[.)]\s+)/;

// Teks responsibilities/requirements disimpan apa adanya, dirapikan cuma waktu ditampilkan.
export function toPoints(text: string | null): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(BULLET, "").trim())
    .filter(Boolean);
}

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

// Tanggal hari ini (zona waktu lokal) dalam format kolom `date`.
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// applied_at itu kolom `date` ("YYYY-MM-DD"). Di-parse sebagai tanggal lokal biar nggak geser karena zona waktu.
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return dateFormat.format(new Date(y, m - 1, d));
}

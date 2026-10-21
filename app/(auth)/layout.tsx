export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main style={{ maxWidth: 420, margin: "0 auto", padding: "10vh 16px" }}>{children}</main>;
}

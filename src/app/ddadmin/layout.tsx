import { PropsWithChildren } from "react";
import { AdminShell } from "./components/AdminShell";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="w-full relative">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

import { WxScript } from "@/components/WxScript";

export default function SubjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WxScript />
      {children}
    </>
  );
}

export const MainWrap = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="wrap-main">
      <main className="flex-grow">{children}</main>
    </div>
  );
}
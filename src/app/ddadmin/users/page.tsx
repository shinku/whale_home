import UsersPage from "./components/wrap";

export async function generateStaticParams() {
  return [{ slug: "default" }];
}

export default function Page() {
  return (
    <div>
      <UsersPage />
    </div>
  );
}

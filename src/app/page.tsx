import { HomeClient } from "@/client/components/home-client";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Alpha World</h1>
        <p className="text-slate-600">
          Next.js + TypeScript（App Router）已完成，并已接入 tRPC、Ant Design、Tailwind CSS。
        </p>
      </section>
      <HomeClient />
    </main>
  );
}

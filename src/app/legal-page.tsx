import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

type LegalPageProps = {
  title: string;
  filename: string;
};

export async function LegalPage({ title, filename }: LegalPageProps) {
  const filePath = path.join(process.cwd(), "public", "legal", filename);
  const content = await readFile(filePath, "utf8");

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-black uppercase tracking-[0.18em]">
            BIP HORIZON
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition hover:bg-black hover:text-white"
          >
            Retour
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-black/55">
          Politique du site
        </p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-5xl">
          {title}
        </h1>
        <article className="mt-10 rounded-lg border border-black/10 bg-[#f7f7f7] p-5 shadow-sm sm:p-8">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-black/78 sm:text-[15px]">
            {content}
          </pre>
        </article>
      </section>
    </main>
  );
}

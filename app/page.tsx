export const revalidate = 60; // Revalidate content every 60s

type WpRendered = { rendered: string };
type WpPage = {
  id: number;
  slug: string;
  date: string;
  title: WpRendered;
  excerpt?: WpRendered;
  content?: WpRendered;
  link?: string;
};

async function fetchPages(): Promise<WpPage[]> {
  const endpoint = process.env.WORDPRESS_ENDPOINT;
  if (!endpoint) {
    throw new Error("Missing WORDPRESS_ENDPOINT env var");
  }

  const res = await fetch(endpoint, {
    // Use Next.js caching with ISR; customize above via revalidate export
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch from WordPress: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as WpPage[];
  return Array.isArray(data) ? data : [];
}

export default async function Home() {
  let pages: WpPage[] = [];
  let error: string | null = null;

  try {
    pages = await fetchPages();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main className="font-sans min-h-screen p-8 sm:p-20">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold">WordPress Pages</h1>
          <span className="text-sm text-gray-500">Source: WORDPRESS_ENDPOINT</span>
        </header>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">Unable to load content</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-red-600/80">
              Ensure WordPress is running and WORDPRESS_ENDPOINT is reachable.
            </p>
          </div>
        ) : pages.length === 0 ? (
          <div className="rounded-md border p-4 text-gray-600">No pages found.</div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2">
            {pages.map((page) => (
              <article
                key={page.id}
                className="rounded-lg border bg-white p-5 shadow-sm hover:shadow transition-shadow"
              >
                <h2 className="text-xl font-semibold" dangerouslySetInnerHTML={{ __html: page.title?.rendered ?? "Untitled" }} />
                <p className="mt-1 text-xs text-gray-500">
                  {page.date ? new Date(page.date).toLocaleDateString() : ""}
                </p>

                {/* Prefer excerpt when available, fall back to truncated content */}
                <div
                  className="prose prose-sm mt-3 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      page.excerpt?.rendered ??
                      (page.content?.rendered
                        ? page.content.rendered.slice(0, 500) + (page.content.rendered.length > 500 ? "…" : "")
                        : ""),
                  }}
                />

                {page.link ? (
                  <a
                    href={page.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    Read on WordPress
                    <span aria-hidden>↗</span>
                  </a>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

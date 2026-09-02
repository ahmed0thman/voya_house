/**
 * Generic JSON-LD renderer.
 *
 * Server Component — renders a `<script type="application/ld+json">` tag
 * with XSS-safe serialisation (replaces `<` with its unicode escape).
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", ... }} />
 */
export function JsonLd<T extends Record<string, unknown>>({
  data,
}: {
  data: T;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

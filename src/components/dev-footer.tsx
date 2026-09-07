export function DevFooter() {
  return (
    <footer className="border-t border-border px-6 py-6 text-center text-xs text-silver">
      <p className="mb-1">
        Entwickelt von{" "}
        <a
          href="https://www.hoven-smart-digital.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-copper-light hover:underline"
        >
          Hoven - smart Digital e.K.
        </a>
      </p>
      <p>
        Bahnhofstraße 54, 48356 Nordwalde · Tel. 0151 68426264 ·{" "}
        <a href="mailto:mail@hoven-smart-digital.de" className="hover:text-copper-light">
          mail@hoven-smart-digital.de
        </a>
      </p>
    </footer>
  );
}

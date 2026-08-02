// Runs before paint to avoid a flash: defaults to light unless the user
// previously chose dark via the toggle (localStorage "groww-pulse-theme").
export function ThemeInit() {
  const script = `
    (function () {
      try {
        var saved = localStorage.getItem("groww-pulse-theme");
        if (saved === "dark") document.documentElement.classList.add("dark");
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

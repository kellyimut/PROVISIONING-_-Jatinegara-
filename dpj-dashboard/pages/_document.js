import Document, { Html, Head, Main, NextScript } from "next/document";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = window.localStorage.getItem("dpj-theme");
    var valid = ["fiber-night", "daylight", "signal-vivid", "midnight-gold"];
    var theme = valid.indexOf(saved) !== -1 ? saved : "fiber-night";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "fiber-night");
  }
})();
`;

class MyDocument extends Document {
  render() {
    return (
      <Html lang="id">
        <Head>
          <meta charSet="utf-8" />
          <meta
            name="description"
            content="Dashboard pengawasan provisioning LIVE untuk STO Jatinegara — order harian, status BIMA, produktivitas teknisi, dan KPI RE/PS."
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link
            href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
          <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%2322d3ee%22/></svg>" />
          {/* eslint-disable-next-line react/no-danger */}
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

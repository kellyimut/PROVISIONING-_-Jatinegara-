export default function SectionCard({ eyebrow, title, right, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <div className="head">
        <div>
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <h2>{title}</h2>
        </div>
        {right ? <div className="right">{right}</div> : null}
      </div>
      <div className="fiber-line" style={{ margin: "14px 0 18px" }} />
      <div className="body">{children}</div>
      <style jsx>{`
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px 24px 26px;
          box-shadow: var(--shadow);
        }
        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .eyebrow {
          font-family: var(--font-mono);
          font-size: 11.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
        }
        h2 {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 700;
          margin: 0;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .body {
          color: var(--text);
        }
      `}</style>
    </section>
  );
}

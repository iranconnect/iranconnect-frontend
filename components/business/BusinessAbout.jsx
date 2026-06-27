//frontend/components/business/BusinessAbout.jsx
function toPlainText(value) {
  if (!value) return "";

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function BusinessAbout({ biz }) {
  const description = toPlainText(
    biz.full_description
  );

  if (!description) {
    return null;
  }

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">
        About
      </h2>

      <p className="text-sm text-justify-pro whitespace-pre-line">
        {description}
      </p>
    </section>
  );
}

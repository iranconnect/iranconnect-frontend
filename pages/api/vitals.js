//pages/api/vitals.js
export default function handler(req, res) {
  try {
    const metric = JSON.parse(req.body || "{}");

    console.log("📊 Web Vital:", {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      route: metric.page,
    });

    // later: store in DB or forward to analytics
    return res.status(200).end();
  } catch {
    return res.status(400).end();
  }
}

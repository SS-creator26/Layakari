// Shared links (/c/<composition>, /u/<person>, /a/<academy>) get their own title and description, so
// WhatsApp, iMessage and social apps show what the link is. Everyone then gets the normal Layakari page.
// It only reads public information (the same anyone can see on the site) with the public key.
const fs = require("fs"), path = require("path");
const SUPABASE_URL = process.env.SUPABASE_URL || "https://srqvcszvnerdrldxnmbq.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_mrNlVjna0IQSGo27MkBsDw_rOc7b72J";
const TAALS = { teentaal: "Teentaal", jhaptaal: "Jhaptaal", rupak: "Rupak", ektaal: "Ektaal", dhamar: "Dhamar" };
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let shell = null;
async function page(origin) {
  if (shell) return shell;
  for (const p of [path.join(process.cwd(), "index.html"), path.join(__dirname, "..", "index.html")]) {
    try { shell = fs.readFileSync(p, "utf8"); return shell; } catch (e) { /* try the next place */ }
  }
  return (await fetch(origin + "/index.html")).text();
}
async function rows(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, { headers: { apikey: SUPABASE_KEY, Accept: "application/json" } });
  return r.ok ? r.json() : [];
}
async function describe(type, slug) {
  const s = encodeURIComponent(slug);
  if (type === "c") {
    const [c] = await rows(`compositions?slug=eq.${s}&select=title,form,taal,laya,owner_id&limit=1`);
    if (!c) return null;
    const [p] = await rows(`people?id=eq.${c.owner_id}&select=name&limit=1`);
    return { title: `${c.title} · ${c.form} by ${p ? p.name : "a Layakari artist"}`,
      description: `${c.form} in ${TAALS[c.taal] || c.taal}, ${c.laya} laya. Hear the theka and read the first line free on Layakari.` };
  }
  if (type === "u") {
    const [p] = await rows(`people?handle=eq.${s}&select=name,city,bio&limit=1`);
    if (!p) return null;
    return { title: `${p.name} on Layakari`, page: `${p.name} · Layakari`, description: (p.bio || "").slice(0, 160) || `Compositions and academy of ${p.name}${p.city ? ", " + p.city : ""}, on Layakari.` };
  }
  if (type === "a") {
    const [a] = await rows(`academies?slug=eq.${s}&select=name,about,owner_id&limit=1`);
    if (!a) return null;
    const [p] = await rows(`people?id=eq.${a.owner_id}&select=name&limit=1`);
    return { title: `${a.name}${p ? " · academy of " + p.name : ""}`, description: (a.about || "").slice(0, 160) || `Learn Kathak with ${a.name} on Layakari.` };
  }
  return null;
}
function withPreview(html, meta, url) {
  const t = esc(meta.title), d = esc(meta.description), u = esc(url);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.page || meta.title + " · Layakari")}</title>`);
  const set = (attr, key, val) => {
    const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*">`);
    const tag = `<meta ${attr}="${key}" content="${val}">`;
    html = re.test(html) ? html.replace(re, tag) : html.replace("</head>", tag + "\n</head>");
  };
  set("name", "description", d); set("property", "og:title", t); set("property", "og:description", d); set("property", "og:url", u);
  set("name", "twitter:card", "summary"); set("name", "twitter:title", t); set("name", "twitter:description", d);
  return html;
}
module.exports = async (req, res) => {
  const { type, slug } = req.query || {};
  const host = req.headers["x-forwarded-host"] || req.headers.host || "layakari.ca";
  const origin = `${req.headers["x-forwarded-proto"] || "https"}://${host}`;
  let html = await page(origin);
  try {
    const meta = await describe(type, String(slug || "").toLowerCase());
    if (meta) html = withPreview(html, meta, `${origin}/${type}/${slug}`);
  } catch (e) { /* without a preview the page still works */ }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  res.status(200).send(html);
};

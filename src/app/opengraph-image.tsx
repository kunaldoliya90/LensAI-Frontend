import { ImageResponse } from "next/og";

export const alt = "LensAI — verify documents, write the verdict in your database";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card every shared link renders as. Built here rather than as a static
 * asset so the wording cannot drift from the hero it is quoting.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#070c18",
          backgroundImage:
            "radial-gradient(900px 500px at 12% 0%, rgba(99,102,241,0.42), transparent 62%), radial-gradient(800px 460px at 92% 8%, rgba(168,85,247,0.34), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(135deg, #6366f1, #a855f7)",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                border: "4px solid #ffffff",
              }}
            />
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: "#e8eefb" }}>LensAI</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "#e8eefb",
              letterSpacing: -2,
            }}
          >
            Verify documents.
          </div>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "#8b95f8",
              letterSpacing: -2,
            }}
          >
            Write the verdict in your database.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 24 }}>
          <div style={{ color: "#93a3c0" }}>Signed webhooks</div>
          <div style={{ color: "#2f3d59" }}>·</div>
          <div style={{ color: "#93a3c0" }}>Per-field evidence</div>
          <div style={{ color: "#2f3d59" }}>·</div>
          <div style={{ color: "#93a3c0" }}>Bring your own model</div>
        </div>
      </div>
    ),
    size,
  );
}

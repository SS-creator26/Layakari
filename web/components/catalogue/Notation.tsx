import { Icon } from "@/components/ui/Icon";
import s from "./notation.module.css";

const FILLER = ["Dha Dhin Dhin Dha Dha Dhin", "Kran-dha Kran-dha Dha-ge", "Tira-kita Taka Dhum-kita", "Dha – Dha – Dha (×3)"];

/**
 * The notation block inside the theka panel. Without access, only the first line is shown; the rest are
 * stand-in shapes (never the real bols), so nothing locked reaches the page.
 */
export function Notation({ full, preview, lineCount, lockedMessage }: { full: string | null; preview: string; lineCount: number; lockedMessage: string }) {
  return (
    <>
      <h3 className={s.heading}>Notation</h3>
      {full !== null ? (
        <pre className={s.bols}>{full || "No notation written yet."}</pre>
      ) : (
        <>
          <div className={s.bols}>
            <div>{preview || "No notation written yet."}</div>
            {Array.from({ length: Math.min(Math.max(lineCount - 1, 0), 6) }, (_, i) => (
              <div key={i} aria-hidden="true" className={s.blur}>
                {FILLER[i % FILLER.length]}
              </div>
            ))}
          </div>
          <p className={s.lock}>
            <Icon name="lock" size={18} />
            {lockedMessage}
          </p>
        </>
      )}
    </>
  );
}

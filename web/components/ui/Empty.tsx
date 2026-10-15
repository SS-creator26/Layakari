import type { ReactNode } from "react";
import { ui } from "./ui";

export function Empty({ title, children, actions }: { title?: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={ui.empty}>
      {title ? <strong>{title}</strong> : null}
      {children ? <p>{children}</p> : null}
      {actions ? <div className="row" style={{ justifyContent: "center" }}>{actions}</div> : null}
    </div>
  );
}

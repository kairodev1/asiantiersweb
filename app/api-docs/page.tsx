import type { Metadata } from "next";
import { ApiDocs } from "./docs";

export const metadata: Metadata = {
  title: "API Documentation",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="nav-offset container-x">
      <ApiDocs />
    </div>
  );
}

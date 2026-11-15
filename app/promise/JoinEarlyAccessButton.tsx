"use client";

import { ArrowRight } from "lucide-react";

export default function JoinEarlyAccessButton() {
  return <button
    className="button button-light"
    type="button"
    onClick={() => window.location.assign("/#join")}
  >
    Join early access <ArrowRight size={16} />
  </button>;
}

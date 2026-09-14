import React from "react";
import { MissionControlSkeleton } from "@/components/admin";

export default function AdminLoading() {
  return (
    <div className="py-2">
      <MissionControlSkeleton />
    </div>
  );
}

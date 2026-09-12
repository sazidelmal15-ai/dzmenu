"use client";

import React from "react";

export function ThemeLoadingSkeleton() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 md:p-6 select-none bg-transparent">
      <div className="w-full min-h-screen md:min-h-0 md:h-[92vh] md:max-h-[900px] md:max-w-[430px] mx-auto md:rounded-[36px] flex flex-col items-center justify-center relative">
        <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin opacity-40" />
      </div>
    </div>
  );
}

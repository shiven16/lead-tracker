import React from 'react';

export default function Header() {
  return (
    <header className="w-full">
      <div className="max-w-[1200px] mx-auto px-margin-desktop pt-space-lg pb-space-sm flex items-center gap-2">
        <span className="font-label-lg text-label-lg text-primary tracking-wide">THAW</span>
        <span className="text-line text-sm">|</span>
        <span className="font-title-md text-[15px] font-semibold text-on-surface">Thaw Refrigeration Service</span>
      </div>
    </header>
  );
}

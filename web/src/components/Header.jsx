import React from 'react';

export default function Header({ user, onLogout }) {
  return (
    <header className="w-full">
      <div className="max-w-[1200px] mx-auto px-margin-desktop pt-space-lg pb-space-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-label-lg text-label-lg text-primary tracking-wide">THAW</span>
          <span className="text-line text-sm">|</span>
          <span className="font-title-md text-[15px] font-semibold text-on-surface">Thaw Refrigeration Service</span>
        </div>
        {user && <button type="button" onClick={onLogout} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-surface hover:text-on-surface">Sign out</button>}
      </div>
    </header>
  );
}

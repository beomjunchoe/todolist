"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isIosUserAgent() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallShortcut() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIosUserAgent()) {
      setShowIosGuide((value) => !value);
      return;
    }

    setShowIosGuide((value) => !value);
  }

  if (installed) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)]">
          홈 화면 추가 완료
        </p>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
          이 기기에서는 바로가기 앱처럼 열립니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)]">
            홈 화면 바로가기
          </p>
          <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
            휴대폰에서 앱처럼 바로 열 수 있습니다.
          </p>
        </div>
        <button
          className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
          onClick={handleInstall}
          type="button"
        >
          홈 화면 추가
        </button>
      </div>

      {showIosGuide ? (
        <div className="mt-3 rounded-2xl bg-[rgba(255,255,255,0.86)] px-3 py-3 text-[11px] leading-6 text-[var(--muted)]">
          아이폰 사파리에서는 자동 설치 창이 안 뜰 수 있습니다. 아래 순서로 추가하면 됩니다.
          <br />
          사파리 하단 공유 버튼 → 홈 화면에 추가
        </div>
      ) : null}
    </div>
  );
}

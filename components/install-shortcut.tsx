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

function isKakaoInAppBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /kakaotalk/i.test(navigator.userAgent);
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
  const [showKakaoGuide, setShowKakaoGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);
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
    if (isKakaoInAppBrowser()) {
      setShowKakaoGuide((value) => !value);
      setShowIosGuide(false);
      setShowGenericGuide(false);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIosUserAgent()) {
      setShowIosGuide((value) => !value);
      setShowKakaoGuide(false);
      setShowGenericGuide(false);
      return;
    }

    setShowGenericGuide((value) => !value);
    setShowIosGuide(false);
    setShowKakaoGuide(false);
  }

  if (installed) {
    return (
      <div className="rounded-[22px] border border-[var(--line)] bg-white/78 px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)]">
          홈 화면 추가 완료
        </p>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
          이 기기에서는 앱처럼 바로 열 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-white/78 px-4 py-3">
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)]">
            홈 화면 바로가기
          </p>
          <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
            휴대폰에서 앱처럼 바로 열 수 있게 홈 화면에 추가해 두세요.
          </p>
        </div>
        <button
          className="w-full rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold"
          onClick={handleInstall}
          type="button"
        >
          홈 화면 추가
        </button>
      </div>

      {showKakaoGuide ? (
        <div className="mt-3 rounded-2xl bg-[rgba(255,255,255,0.88)] px-3 py-3 text-[11px] leading-6 text-[var(--muted)]">
          카카오톡 안에서는 홈 화면 추가가 바로 되지 않습니다.
          <br />
          우측 상단 메뉴에서 외부 브라우저로 연 뒤 다시 눌러 주세요.
        </div>
      ) : null}

      {showIosGuide ? (
        <div className="mt-3 rounded-2xl bg-[rgba(255,255,255,0.88)] px-3 py-3 text-[11px] leading-6 text-[var(--muted)]">
          아이폰은 자동 설치창이 뜨지 않습니다.
          <br />
          사파리 하단 공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택해 주세요.
        </div>
      ) : null}

      {showGenericGuide ? (
        <div className="mt-3 rounded-2xl bg-[rgba(255,255,255,0.88)] px-3 py-3 text-[11px] leading-6 text-[var(--muted)]">
          이 브라우저에서는 설치창이 바로 안 뜰 수 있습니다.
          <br />
          크롬이나 사파리 메뉴에서 “홈 화면에 추가”를 선택해 주세요.
        </div>
      ) : null}
    </div>
  );
}

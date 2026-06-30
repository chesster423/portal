function assetUrl(base, file) {
  const root = String(base || "/").replace(/\/?$/, "/");
  return `${root}${file}`;
}

let bootAudio = null;
let loginAudio = null;
let navSelectAudio = null;
let loginPlayed = false;
let loginUnlockBound = false;

function playClip(audio) {
  if (!audio) return Promise.reject(new Error("no audio"));
  audio.currentTime = 0;
  return audio.play();
}

function bindLoginUnlock() {
  if (loginUnlockBound || loginPlayed) return;
  loginUnlockBound = true;

  const tryLogin = () => {
    if (loginPlayed) {
      teardown();
      return;
    }
    playClip(loginAudio)
      .then(() => {
        loginPlayed = true;
        teardown();
      })
      .catch(() => {});
  };

  const teardown = () => {
    ["pointerdown", "touchstart", "keydown"].forEach((type) => {
      document.removeEventListener(type, tryLogin, true);
    });
    loginUnlockBound = false;
  };

  ["pointerdown", "touchstart", "keydown"].forEach((type) => {
    document.addEventListener(type, tryLogin, true);
  });
}

export function initUiSounds(base) {
  const root = String(base || "/").replace(/\/?$/, "/");

  bootAudio = document.getElementById("ps5-boot-audio") || bootAudio;
  if (bootAudio) {
    bootAudio.preload = "auto";
    bootAudio.volume = 0.85;
  }

  loginAudio = document.getElementById("ps5-login-audio") || loginAudio;
  if (!loginAudio) {
    loginAudio = new Audio(assetUrl(root, "ps5-login.mp3"));
    loginAudio.preload = "auto";
    loginAudio.volume = 0.85;
  }

  if (window.__portalLoginSoundPlayed) {
    loginPlayed = true;
  }

  if (!navSelectAudio) {
    navSelectAudio = new Audio(assetUrl(root, "ps5-selection-button.mp3"));
    navSelectAudio.preload = "auto";
    navSelectAudio.volume = 0.75;
  }
}

export function playBootSound() {
  return playClip(bootAudio).catch(() => {});
}

export function playLoginSoundOnce() {
  if (loginPlayed) return Promise.resolve();

  return playClip(loginAudio)
    .then(() => {
      loginPlayed = true;
    })
    .catch(() => {
      bindLoginUnlock();
    });
}

export function playNavSelectSound() {
  return playClip(navSelectAudio).catch(() => {});
}

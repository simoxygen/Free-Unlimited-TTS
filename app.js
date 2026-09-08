/**
 * Free Unlimited TTS Engine
 * Client-Side Application with Theme Toggle, Smooth Playback, In-Button Status Feedback & Level 0 Flat UI
 */

const API_KEY = "ab3416701cc2030f7f405d4915c542b218e9686f";
const API_ENDPOINT = "https://api.deepgram.com/v2/speak";
const MAX_CHARS = 5000;

// LocalStorage Keys
const STORAGE_TEXT = "free_tts_input_text";
const STORAGE_VOICE_ID = "free_tts_selected_voice_id";
const STORAGE_SPEED = "free_tts_selected_speed";
const STORAGE_FAVORITES = "free_tts_favorite_voices";
const STORAGE_GENDER_FILTER = "free_tts_gender_filter";
const STORAGE_ACCENT_FILTER = "free_tts_accent_filter";
const STORAGE_FAVS_FILTER = "free_tts_favs_filter";
const STORAGE_HISTORY = "free_tts_history_clips";
const STORAGE_THEME = "free_tts_theme";

// Deterministic Gender-Matched Real Human Portrait Photo API (RandomUser Headshots)
const VOICE_AVATARS = {
  kit: "https://randomuser.me/api/portraits/men/32.jpg",
  alexis: "https://randomuser.me/api/portraits/women/44.jpg",
  hannah: "https://randomuser.me/api/portraits/women/68.jpg",
  cliff: "https://randomuser.me/api/portraits/men/46.jpg",
  sienna: "https://randomuser.me/api/portraits/women/65.jpg",
  cole: "https://randomuser.me/api/portraits/men/86.jpg",
  haley: "https://randomuser.me/api/portraits/women/33.jpg",
  miles: "https://randomuser.me/api/portraits/men/11.jpg",
  gemma: "https://randomuser.me/api/portraits/women/90.jpg",
  sean: "https://randomuser.me/api/portraits/men/75.jpg",
  brooke: "https://randomuser.me/api/portraits/women/26.jpg",
  colin: "https://randomuser.me/api/portraits/men/52.jpg",
  heather: "https://randomuser.me/api/portraits/women/47.jpg",
  elise: "https://randomuser.me/api/portraits/women/12.jpg",
  jack: "https://randomuser.me/api/portraits/men/62.jpg",
  bree: "https://randomuser.me/api/portraits/women/21.jpg",
  brittany: "https://randomuser.me/api/portraits/women/63.jpg",
  bruce: "https://randomuser.me/api/portraits/men/91.jpg",
  conor: "https://randomuser.me/api/portraits/men/43.jpg",
  donovan: "https://randomuser.me/api/portraits/men/54.jpg",
  drew: "https://randomuser.me/api/portraits/men/22.jpg",
  kai: "https://randomuser.me/api/portraits/men/34.jpg",
  kelsey: "https://randomuser.me/api/portraits/women/50.jpg",
  maeve: "https://randomuser.me/api/portraits/women/28.jpg",
  marcelo: "https://randomuser.me/api/portraits/men/40.jpg",
  marcus: "https://randomuser.me/api/portraits/men/68.jpg",
  meena: "https://randomuser.me/api/portraits/women/79.jpg",
  meghan: "https://randomuser.me/api/portraits/women/54.jpg",
  naveen: "https://randomuser.me/api/portraits/men/82.jpg",
  paige: "https://randomuser.me/api/portraits/women/89.jpg",
  priya: "https://randomuser.me/api/portraits/women/66.jpg",
  rufus: "https://randomuser.me/api/portraits/men/64.jpg",
  sharon: "https://randomuser.me/api/portraits/women/58.jpg",
  tanner: "https://randomuser.me/api/portraits/men/18.jpg",
  wade: "https://randomuser.me/api/portraits/men/76.jpg",
  wes: "https://randomuser.me/api/portraits/men/85.jpg"
};

function getVoiceAvatar(name) {
  const key = (name || "").toLowerCase();
  return VOICE_AVATARS[key] || "https://randomuser.me/api/portraits/men/32.jpg";
}

// Deterministic Pinned Human Profile Pictures for all 36 Voices
const STUDIO_VOICES = [
  { id: "kit", name: "Kit", model: "flux-kit-en", gender: "Male", accent: "British", tone: "Helpful, calm", avatar: getVoiceAvatar("kit") },
  { id: "alexis", name: "Alexis", model: "flux-alexis-en", gender: "Female", accent: "American", tone: "Clear, warm", avatar: getVoiceAvatar("alexis") },
  { id: "hannah", name: "Hannah", model: "flux-hannah-en", gender: "Female", accent: "American", tone: "Confident, thoughtful", avatar: getVoiceAvatar("hannah") },
  { id: "cliff", name: "Cliff", model: "flux-cliff-en", gender: "Male", accent: "American", tone: "Deep, resonant", avatar: getVoiceAvatar("cliff") },
  { id: "sienna", name: "Sienna", model: "flux-sienna-en", gender: "Female", accent: "American", tone: "Warm, articulate", avatar: getVoiceAvatar("sienna") },
  { id: "cole", name: "Cole", model: "flux-cole-en", gender: "Male", accent: "American", tone: "Dynamic, crisp", avatar: getVoiceAvatar("cole") },
  { id: "haley", name: "Haley", model: "flux-haley-en", gender: "Female", accent: "American", tone: "Natural, engaging", avatar: getVoiceAvatar("haley") },
  { id: "miles", name: "Miles", model: "flux-miles-en", gender: "Male", accent: "American", tone: "Conversational, smooth", avatar: getVoiceAvatar("miles") },
  { id: "gemma", name: "Gemma", model: "flux-gemma-en", gender: "Female", accent: "British", tone: "Sophisticated, clear", avatar: getVoiceAvatar("gemma") },
  { id: "sean", name: "Sean", model: "flux-sean-en", gender: "Male", accent: "Irish", tone: "Charismatic, warm", avatar: getVoiceAvatar("sean") },
  { id: "brooke", name: "Brooke", model: "flux-brooke-en", gender: "Female", accent: "American", tone: "Upbeat, friendly", avatar: getVoiceAvatar("brooke") },
  { id: "colin", name: "Colin", model: "flux-colin-en", gender: "Male", accent: "American", tone: "Steady, direct", avatar: getVoiceAvatar("colin") },
  { id: "heather", name: "Heather", model: "flux-heather-en", gender: "Female", accent: "American", tone: "Calm, engaging", avatar: getVoiceAvatar("heather") },
  { id: "elise", name: "Elise", model: "flux-elise-en", gender: "Female", accent: "American", tone: "Gentle, pleasant", avatar: getVoiceAvatar("elise") },
  { id: "jack", name: "Jack", model: "flux-jack-en", gender: "Male", accent: "American", tone: "Energetic, clear", avatar: getVoiceAvatar("jack") },
  { id: "bree", name: "Bree", model: "flux-bree-en", gender: "Female", accent: "American", tone: "Conversational", avatar: getVoiceAvatar("bree") },
  { id: "brittany", name: "Brittany", model: "flux-brittany-en", gender: "Female", accent: "American", tone: "Upbeat, casual", avatar: getVoiceAvatar("brittany") },
  { id: "bruce", name: "Bruce", model: "flux-bruce-en", gender: "Male", accent: "American", tone: "Commanding", avatar: getVoiceAvatar("bruce") },
  { id: "conor", name: "Conor", model: "flux-conor-en", gender: "Male", accent: "Irish", tone: "Lyrical", avatar: getVoiceAvatar("conor") },
  { id: "donovan", name: "Donovan", model: "flux-donovan-en", gender: "Male", accent: "American", tone: "Reliable", avatar: getVoiceAvatar("donovan") },
  { id: "drew", name: "Drew", model: "flux-drew-en", gender: "Male", accent: "American", tone: "Casual", avatar: getVoiceAvatar("drew") },
  { id: "kai", name: "Kai", model: "flux-kai-en", gender: "Male", accent: "American", tone: "Contemporary", avatar: getVoiceAvatar("kai") },
  { id: "kelsey", name: "Kelsey", model: "flux-kelsey-en", gender: "Female", accent: "American", tone: "Expressive", avatar: getVoiceAvatar("kelsey") },
  { id: "maeve", name: "Maeve", model: "flux-maeve-en", gender: "Female", accent: "Irish", tone: "Gentle", avatar: getVoiceAvatar("maeve") },
  { id: "marcelo", name: "Marcelo", model: "flux-marcelo-en", gender: "Male", accent: "American", tone: "Polished", avatar: getVoiceAvatar("marcelo") },
  { id: "marcus", name: "Marcus", model: "flux-marcus-en", gender: "Male", accent: "American", tone: "Authoritative", avatar: getVoiceAvatar("marcus") },
  { id: "meena", name: "Meena", model: "flux-meena-en", gender: "Female", accent: "Indian", tone: "Articulate", avatar: getVoiceAvatar("meena") },
  { id: "meghan", name: "Meghan", model: "flux-meghan-en", gender: "Female", accent: "American", tone: "Friendly", avatar: getVoiceAvatar("meghan") },
  { id: "naveen", name: "Naveen", model: "flux-naveen-en", gender: "Male", accent: "Indian", tone: "Warm", avatar: getVoiceAvatar("naveen") },
  { id: "paige", name: "Paige", model: "flux-paige-en", gender: "Female", accent: "American", tone: "Vibrant", avatar: getVoiceAvatar("paige") },
  { id: "priya", name: "Priya", model: "flux-priya-en", gender: "Female", accent: "Indian", tone: "Melodic", avatar: getVoiceAvatar("priya") },
  { id: "rufus", name: "Rufus", model: "flux-rufus-en", gender: "Male", accent: "British", tone: "Distinguished", avatar: getVoiceAvatar("rufus") },
  { id: "sharon", name: "Sharon", model: "flux-sharon-en", gender: "Female", accent: "American", tone: "Reassuring", avatar: getVoiceAvatar("sharon") },
  { id: "tanner", name: "Tanner", model: "flux-tanner-en", gender: "Male", accent: "American", tone: "Energetic", avatar: getVoiceAvatar("tanner") },
  { id: "wade", name: "Wade", model: "flux-wade-en", gender: "Male", accent: "American", tone: "Grounded", avatar: getVoiceAvatar("wade") },
  { id: "wes", name: "Wes", model: "flux-wes-en", gender: "Male", accent: "American", tone: "Direct", avatar: getVoiceAvatar("wes") }
];

// App State
let selectedVoice = STUDIO_VOICES[0];
let selectedSpeed = 1.0;
let currentGenderFilter = "all";
let currentAccentFilter = "all";
let currentTheme = "light";
let favoriteVoiceIds = new Set();
let currentAudioBlob = null;
let currentAudioUrl = null;
let recentClips = [];

// Preview Cache & Active State
const previewCache = new Map();
let currentPreviewAudio = null;
let currentPreviewVoiceId = null;

// History Audio State
let activeHistoryAudio = null;
let activeHistoryClipId = null;
let historyAnimFrameId = null;

// Main Player Smooth 60fps Scrubber Animation Frame
let animFrameId = null;
let ctaTimer = null;

// DOM Elements
const textInput = document.getElementById("text-input");
const charCounter = document.getElementById("char-counter");
const btnPaste = document.getElementById("btn-paste");
const btnClear = document.getElementById("btn-clear");
const btnGenerate = document.getElementById("btn-generate");
const btnGenerateText = document.getElementById("btn-generate-text");
const btnKofiSupport = document.getElementById("btn-kofi-support");

// Speed Dropdown Elements
const btnSpeedTrigger = document.getElementById("btn-speed-trigger");
const speedDisplayLabel = document.getElementById("speed-display-label");
const speedMenu = document.getElementById("speed-menu");

// Voice Picker Elements
const btnOpenVoiceModal = document.getElementById("btn-open-voice-modal");
const activeVoiceImg = document.getElementById("active-voice-img");
const activeVoiceName = document.getElementById("active-voice-name");
const activeVoiceMeta = document.getElementById("active-voice-meta");

// Voice Modal Elements
const voiceModal = document.getElementById("voice-modal");
const btnCloseVoiceModal = document.getElementById("btn-close-voice-modal");
const voiceList = document.getElementById("voice-list");
const voiceSearch = document.getElementById("voice-search");
const voiceCount = document.getElementById("voice-count");

// Modal 3 Custom Dropdown Filters
const btnFilterGender = document.getElementById("btn-filter-gender");
const labelFilterGender = document.getElementById("label-filter-gender");
const menuFilterGender = document.getElementById("menu-filter-gender");

const btnFilterAccent = document.getElementById("btn-filter-accent");
const labelFilterAccent = document.getElementById("label-filter-accent");
const menuFilterAccent = document.getElementById("menu-filter-accent");

const btnFilterFavs = document.getElementById("btn-filter-favs");

// Main Player Elements
const playerContainer = document.getElementById("player-container");
const playerCardSkeleton = document.getElementById("player-card-skeleton");
const playerCardBody = document.getElementById("player-card-body");
const playerVoiceImg = document.getElementById("player-voice-img");
const playerVoiceNameLabel = document.getElementById("player-voice-name-label");
const playerFirstWords = document.getElementById("player-first-words");
const btnPlayerInfo = document.getElementById("btn-player-info");
const playerInfoPopover = document.getElementById("player-info-popover");
const infoVoiceName = document.getElementById("info-voice-name");
const infoSpeed = document.getElementById("info-speed");
const infoSize = document.getElementById("info-size");

// Download Dropdown Elements
const btnDlMenuTrigger = document.getElementById("btn-dl-menu-trigger");
const dlMenu = document.getElementById("dl-menu");
const dlOptionMp3 = document.getElementById("dl-option-mp3");
const dlOptionWav = document.getElementById("dl-option-wav");

// Audio Controls
const btnPlayPause = document.getElementById("btn-play-pause");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");
const scrubberTimeline = document.getElementById("scrubber-timeline");
const scrubberFill = document.getElementById("scrubber-fill");
const timeCurrent = document.getElementById("time-current");
const timeTotal = document.getElementById("time-total");
const audioElement = document.getElementById("audio-element");

// Recent History Elements
const recentSection = document.getElementById("recent-section");
const recentHeaderBar = document.getElementById("recent-header-bar");
const recentCountLabel = document.getElementById("recent-count-label");
const btnClearHistory = document.getElementById("btn-clear-history");
const recentContent = document.getElementById("recent-content");
const recentGrid = document.getElementById("recent-grid");

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadSavedState();
  updateActiveVoicePicker();
  setupEventListeners();
  updateTextStats();
  filterAndRenderModalVoices();
  renderRecentClips();
});

/**
 * Updates CTA button label temporarily for status/notifications inside the button
 */
function setButtonFeedback(message, durationMs = 2200) {
  if (ctaTimer) clearTimeout(ctaTimer);
  btnGenerateText.textContent = message;
  ctaTimer = setTimeout(() => {
    btnGenerateText.textContent = "Say It";
  }, durationMs);
}

/**
 * Universal Audio Stop Handler (Prevents concurrent audio playback)
 */
function stopAllAudio() {
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio.currentTime = 0;
    currentPreviewAudio = null;
    currentPreviewVoiceId = null;
    resetAllPreviewButtons();
  }

  if (audioElement && !audioElement.paused) {
    audioElement.pause();
  }
  setPlayerPlayState(false);

  if (activeHistoryAudio) {
    activeHistoryAudio.pause();
    activeHistoryAudio.currentTime = 0;
    activeHistoryAudio = null;
  }
  if (historyAnimFrameId) {
    cancelAnimationFrame(historyAnimFrameId);
    historyAnimFrameId = null;
  }
  activeHistoryClipId = null;
  resetAllHistoryPlayButtons();
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
}

function loadSavedState() {
  const isDarkSystem = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(isDarkSystem ? "dark" : "light");

  // Dynamically switch theme on OS preference change without page refresh
  const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (e) => {
    applyTheme(e.matches ? "dark" : "light");
  };
  if (systemThemeQuery.addEventListener) {
    systemThemeQuery.addEventListener("change", handleSystemThemeChange);
  } else if (systemThemeQuery.addListener) {
    systemThemeQuery.addListener(handleSystemThemeChange);
  }

  const savedText = localStorage.getItem(STORAGE_TEXT);
  if (savedText !== null) {
    textInput.value = savedText;
  }

  const savedVoiceId = localStorage.getItem(STORAGE_VOICE_ID);
  if (savedVoiceId) {
    const found = STUDIO_VOICES.find(v => v.id === savedVoiceId);
    if (found) selectedVoice = found;
  }

  const savedSpeed = localStorage.getItem(STORAGE_SPEED);
  if (savedSpeed) {
    const speedVal = parseFloat(savedSpeed);
    if (!isNaN(speedVal)) {
      selectedSpeed = speedVal;
      const matchingItem = speedMenu.querySelector(`.dropdown-item[data-speed="${speedVal}"]`);
      if (matchingItem) {
        speedMenu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
        matchingItem.classList.add("active");
        speedDisplayLabel.textContent = matchingItem.textContent;
      }
    }
  }

  const savedFavs = localStorage.getItem(STORAGE_FAVORITES);
  if (savedFavs) {
    try {
      const arr = JSON.parse(savedFavs);
      favoriteVoiceIds = new Set(arr);
    } catch (_) {}
  }

  const savedGender = localStorage.getItem(STORAGE_GENDER_FILTER);
  if (savedGender && menuFilterGender) {
    currentGenderFilter = savedGender;
    const item = menuFilterGender.querySelector(`.dropdown-item[data-gender="${savedGender}"]`);
    if (item) {
      menuFilterGender.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      labelFilterGender.textContent = item.textContent;
    }
  }

  const savedAccent = localStorage.getItem(STORAGE_ACCENT_FILTER);
  if (savedAccent && menuFilterAccent) {
    currentAccentFilter = savedAccent;
    const item = menuFilterAccent.querySelector(`.dropdown-item[data-accent="${savedAccent}"]`);
    if (item) {
      menuFilterAccent.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      labelFilterAccent.textContent = item.textContent;
    }
  }

  const savedFavsFilter = localStorage.getItem(STORAGE_FAVS_FILTER);
  if (savedFavsFilter === "starred" && btnFilterFavs) {
    currentFavsFilter = "starred";
    btnFilterFavs.classList.add("active");
  } else {
    currentFavsFilter = "all";
    if (btnFilterFavs) btnFilterFavs.classList.remove("active");
  }

  const savedHistory = localStorage.getItem(STORAGE_HISTORY);
  if (savedHistory) {
    try {
      recentClips = JSON.parse(savedHistory);
    } catch (_) {}
  }
}

function setTextWithUndo(newText) {
  textInput.focus();
  textInput.select();
  try {
    if (!document.execCommand("insertText", false, newText)) {
      textInput.value = newText;
    }
  } catch (_) {
    textInput.value = newText;
  }
  updateTextStats();
  localStorage.setItem(STORAGE_TEXT, textInput.value);
}

function saveHistoryState() {
  try {
    const metaToSave = recentClips.map(c => ({
      id: c.id,
      firstFiveText: c.firstFiveText,
      voiceName: c.voiceName,
      voiceAvatar: c.voiceAvatar,
      voiceAccent: c.voiceAccent,
      voiceGender: c.voiceGender,
      speed: c.speed,
      sizeKb: c.sizeKb,
      durationSec: c.durationSec,
      fullText: c.fullText,
      audioDataUrl: c.audioDataUrl,
      timestamp: c.timestamp
    }));
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(metaToSave));
  } catch (err) {
    console.warn("Storage warning:", err);
    if (recentClips.length > 3) {
      recentClips = recentClips.slice(0, 3);
      saveHistoryState();
    }
  }
}

function setupEventListeners() {
  textInput.addEventListener("input", () => {
    updateTextStats();
    localStorage.setItem(STORAGE_TEXT, textInput.value);
  });

  textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  });

  if (btnKofiSupport) {
    btnKofiSupport.addEventListener("click", () => {
      if (typeof kofiWidgetOverlay !== 'undefined' && typeof kofiWidgetOverlay.open === 'function') {
        try {
          kofiWidgetOverlay.open('alex2620');
          return;
        } catch (_) {}
      }
      window.open('https://ko-fi.com/alex2620', 'kofiWindow', 'width=460,height=680,scrollbars=yes');
    });
  }

  btnPaste.addEventListener("click", async () => {
    try {
      let clipText = await navigator.clipboard.readText();
      if (clipText) {
        if (clipText.length > MAX_CHARS) {
          clipText = clipText.slice(0, MAX_CHARS);
          setButtonFeedback(`Trimmed to ${MAX_CHARS} chars`);
        } else {
          setButtonFeedback("Text pasted!");
        }
        setTextWithUndo(clipText);
      }
    } catch (_) {
      setButtonFeedback("Unable to paste");
    }
  });

  btnClear.addEventListener("click", () => {
    setTextWithUndo("");
    setButtonFeedback("Cleared!");
    textInput.focus();
  });

  document.querySelectorAll(".chip-sample").forEach((chip) => {
    chip.addEventListener("click", () => {
      const sampleText = chip.getAttribute("data-text");
      setTextWithUndo(sampleText);
      textInput.focus();
    });
  });

  // Speed Dropdown Trigger
  btnSpeedTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    speedMenu.classList.toggle("hidden");
    dlMenu.classList.add("hidden");
    if (menuFilterGender) menuFilterGender.classList.add("hidden");
    if (menuFilterAccent) menuFilterAccent.classList.add("hidden");
  });

  speedMenu.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      speedMenu.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      selectedSpeed = parseFloat(item.getAttribute("data-speed"));
      speedDisplayLabel.textContent = item.textContent;
      localStorage.setItem(STORAGE_SPEED, selectedSpeed);
      speedMenu.classList.add("hidden");
    });
  });

  // Download Dropdown Trigger
  btnDlMenuTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dlMenu.classList.toggle("hidden");
    speedMenu.classList.add("hidden");
  });

  dlOptionMp3.addEventListener("click", (e) => {
    e.stopPropagation();
    dlMenu.classList.add("hidden");
    downloadAudio("mp3");
  });

  dlOptionWav.addEventListener("click", (e) => {
    e.stopPropagation();
    dlMenu.classList.add("hidden");
    downloadAudio("wav");
  });

  // Info Popover Toggle
  btnPlayerInfo.addEventListener("click", (e) => {
    e.stopPropagation();
    playerInfoPopover.classList.toggle("hidden");
  });

  // 3 Modal Filters (Gender, Accent, Favorites Chip)
  if (btnFilterGender && menuFilterGender) {
    btnFilterGender.addEventListener("click", (e) => {
      e.stopPropagation();
      menuFilterGender.classList.toggle("hidden");
      if (menuFilterAccent) menuFilterAccent.classList.add("hidden");
    });

    menuFilterGender.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        menuFilterGender.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        currentGenderFilter = item.getAttribute("data-gender");
        labelFilterGender.textContent = item.textContent;
        localStorage.setItem(STORAGE_GENDER_FILTER, currentGenderFilter);
        menuFilterGender.classList.add("hidden");
        filterAndRenderModalVoices();
      });
    });
  }

  if (btnFilterAccent && menuFilterAccent) {
    btnFilterAccent.addEventListener("click", (e) => {
      e.stopPropagation();
      menuFilterAccent.classList.toggle("hidden");
      if (menuFilterGender) menuFilterGender.classList.add("hidden");
    });

    menuFilterAccent.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        menuFilterAccent.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        currentAccentFilter = item.getAttribute("data-accent");
        labelFilterAccent.textContent = item.textContent;
        localStorage.setItem(STORAGE_ACCENT_FILTER, currentAccentFilter);
        menuFilterAccent.classList.add("hidden");
        filterAndRenderModalVoices();
      });
    });
  }

  if (btnFilterFavs) {
    btnFilterFavs.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = btnFilterFavs.classList.toggle("active");
      currentFavsFilter = isActive ? "starred" : "all";
      localStorage.setItem(STORAGE_FAVS_FILTER, currentFavsFilter);
      filterAndRenderModalVoices();
    });
  }

  // Global Outside Click Handler to close all dropdowns & popovers
  document.addEventListener("click", () => {
    speedMenu.classList.add("hidden");
    dlMenu.classList.add("hidden");
    playerInfoPopover.classList.add("hidden");
    if (menuFilterGender) menuFilterGender.classList.add("hidden");
    if (menuFilterAccent) menuFilterAccent.classList.add("hidden");
    document.querySelectorAll(".history-dl-menu").forEach(m => m.classList.add("hidden"));
    document.querySelectorAll(".info-popover-card").forEach(p => p.classList.add("hidden"));
  });

  btnOpenVoiceModal.addEventListener("click", openVoiceModal);
  btnCloseVoiceModal.addEventListener("click", closeVoiceModal);

  voiceModal.addEventListener("click", (e) => {
    if (e.target === voiceModal) closeVoiceModal();
  });

  voiceSearch.addEventListener("input", filterAndRenderModalVoices);

  btnGenerate.addEventListener("click", handleGenerate);
  btnPlayPause.addEventListener("click", () => {
    if (!audioElement.src) return;
    if (audioElement.paused) {
      stopAllAudio();
      audioElement.play();
      setPlayerPlayState(true);
    } else {
      audioElement.pause();
      setPlayerPlayState(false);
    }
  });

  audioElement.addEventListener("loadedmetadata", () => {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
      timeTotal.textContent = formatTime(audioElement.duration);
    }
  });

  audioElement.addEventListener("ended", () => {
    setPlayerPlayState(false);
    cancelAnimationFrame(animFrameId);
    scrubberFill.style.width = "0%";
    timeCurrent.textContent = "0:00";
  });

  makeScrubberDraggable(scrubberTimeline, (fraction) => {
    if (!audioElement.duration) return;
    audioElement.currentTime = fraction * audioElement.duration;
    updateSmoothProgress();
  });

  if (recentHeaderBar) {
    recentHeaderBar.addEventListener("click", (e) => {
      if (e.target.closest("#btn-clear-history")) return;
      const isExpanded = recentHeaderBar.classList.toggle("expanded");
      if (isExpanded) {
        recentContent.classList.remove("hidden");
        if (recentClips.length > 0 && btnClearHistory) {
          btnClearHistory.classList.remove("hidden");
        }
      } else {
        recentContent.classList.add("hidden");
        if (btnClearHistory) btnClearHistory.classList.add("hidden");
      }
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener("click", (e) => {
      e.stopPropagation();
      stopAllAudio();
      recentClips = [];
      localStorage.removeItem(STORAGE_HISTORY);
      renderRecentClips();
    });
  }
}

function updateTextStats() {
  const chars = textInput.value.length;
  charCounter.textContent = `${chars} / ${MAX_CHARS} chars`;
  if (chars >= MAX_CHARS) {
    charCounter.style.color = "var(--color-negative)";
  } else {
    charCounter.style.color = "var(--color-mute)";
  }

  // Auto-hide clear button when text area is empty
  if (chars === 0) {
    btnClear.classList.add("hidden");
  } else {
    btnClear.classList.remove("hidden");
  }
}

function updateActiveVoicePicker(animated = false) {
  if (animated && btnOpenVoiceModal) {
    btnOpenVoiceModal.classList.remove("voice-fade-anim");
    void btnOpenVoiceModal.offsetWidth;
    btnOpenVoiceModal.classList.add("voice-fade-anim");
  }
  activeVoiceImg.src = selectedVoice.avatar;
  const isFav = favoriteVoiceIds.has(selectedVoice.id);
  
  activeVoiceName.innerHTML = `
    ${selectedVoice.name}
    ${isFav ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-star)" stroke="var(--color-star)" stroke-width="2" style="vertical-align: middle; margin-left: 3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` : ''}
  `;
  activeVoiceMeta.textContent = `${selectedVoice.accent} • ${selectedVoice.gender}`;
}

function openVoiceModal() {
  voiceModal.classList.remove("hidden");
  voiceSearch.focus();
}

function closeVoiceModal() {
  voiceModal.classList.add("hidden");
}

function toggleFavoriteVoice(voiceId, e) {
  e.stopPropagation();
  if (favoriteVoiceIds.has(voiceId)) {
    favoriteVoiceIds.delete(voiceId);
  } else {
    favoriteVoiceIds.add(voiceId);
  }
  localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(Array.from(favoriteVoiceIds)));
  updateActiveVoicePicker();
  filterAndRenderModalVoices();
}

function filterAndRenderModalVoices() {
  const query = voiceSearch.value.toLowerCase().trim();

  const filtered = STUDIO_VOICES.filter((voice) => {
    const isFav = favoriteVoiceIds.has(voice.id);

    if (currentFavsFilter === "starred" && !isFav) return false;

    if (currentGenderFilter === "female" && voice.gender.toLowerCase() !== "female") return false;
    if (currentGenderFilter === "male" && voice.gender.toLowerCase() !== "male") return false;

    if (currentAccentFilter === "american" && voice.accent.toLowerCase() !== "american") return false;
    if (currentAccentFilter === "british" && voice.accent.toLowerCase() !== "british") return false;
    if (currentAccentFilter === "irish" && voice.accent.toLowerCase() !== "irish") return false;
    if (currentAccentFilter === "indian" && voice.accent.toLowerCase() !== "indian") return false;

    const matchesSearch =
      !query ||
      voice.name.toLowerCase().includes(query) ||
      voice.accent.toLowerCase().includes(query) ||
      voice.gender.toLowerCase().includes(query) ||
      voice.tone.toLowerCase().includes(query);

    return matchesSearch;
  });

  const favVoices = filtered.filter(v => favoriteVoiceIds.has(v.id));
  const otherVoices = filtered.filter(v => !favoriteVoiceIds.has(v.id));

  voiceList.innerHTML = "";
  voiceCount.textContent = `${filtered.length} voice${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    voiceList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--color-mute); font-size: 13px;">No matching voices found.</div>`;
    return;
  }

  if (favVoices.length > 0) {
    const favHeader = document.createElement("div");
    favHeader.className = "voice-group-title";
    favHeader.textContent = "Favorites";
    voiceList.appendChild(favHeader);
    favVoices.forEach(voice => voiceList.appendChild(createVoiceItemElement(voice)));

    if (otherVoices.length > 0) {
      const otherHeader = document.createElement("div");
      otherHeader.className = "voice-group-title";
      otherHeader.textContent = "All Voices";
      voiceList.appendChild(otherHeader);
    }
  }

  otherVoices.forEach(voice => voiceList.appendChild(createVoiceItemElement(voice)));
}

function createVoiceItemElement(voice) {
  const isSelected = voice.id === selectedVoice.id;
  const isStarred = favoriteVoiceIds.has(voice.id);
  const isPlayingPreview = currentPreviewVoiceId === voice.id && currentPreviewAudio && !currentPreviewAudio.paused;

  const item = document.createElement("div");
  item.className = `voice-item ${isSelected ? "selected" : ""}`;
  item.setAttribute("data-voice-id", voice.id);

  item.innerHTML = `
    <div class="voice-item-left">
      <img class="voice-avatar-img" src="${voice.avatar}" alt="${voice.name}">
      <div class="voice-info">
        <div class="voice-name-row">
          <span class="voice-name">${voice.name}</span>
          ${isSelected ? `
            <span class="selected-check-badge" title="Selected Voice">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          ` : ''}
          <button type="button" class="btn-star-fav ${isStarred ? "starred" : ""}" title="${isStarred ? "Remove from favorites" : "Add to favorites"}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${isStarred ? "var(--color-star)" : "none"}" stroke="${isStarred ? "var(--color-star)" : "currentColor"}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </div>
        <span class="voice-meta">${voice.accent} &bull; ${voice.gender} &bull; ${voice.tone}</span>
      </div>
    </div>
    <div class="voice-actions">
      <button type="button" class="btn-preview ${isPlayingPreview ? "playing" : ""}" data-voice-id="${voice.id}" title="Listen to ${voice.name}">
        ${isPlayingPreview ? `
          <span class="eq-bars">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </span>
          <span>Playing</span>
        ` : `
          <svg class="preview-play-icon" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Listen</span>
        `}
      </button>
    </div>
  `;

  const starBtn = item.querySelector(".btn-star-fav");
  starBtn.addEventListener("click", (e) => toggleFavoriteVoice(voice.id, e));

  item.addEventListener("click", (e) => {
    if (e.target.closest(".btn-preview") || e.target.closest(".btn-star-fav")) return;
    selectVoice(voice);
    closeVoiceModal();
  });

  const previewBtn = item.querySelector(".btn-preview");
  previewBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleVoicePreview(voice, previewBtn);
  });

  return item;
}

function selectVoice(voice) {
  selectedVoice = voice;
  localStorage.setItem(STORAGE_VOICE_ID, voice.id);
  updateActiveVoicePicker(true);
  setButtonFeedback(`Voice set to ${voice.name}`);
}

function getFirstFiveWords(text) {
  if (!text || !text.trim()) return "Generated Audio";
  const words = text.trim().split(/\s+/);
  const snippet = words.slice(0, 5).join(" ");
  return words.length > 5 ? `${snippet}...` : snippet;
}

/**
 * Voice Preview Player: State Sequence: "Listen" -> "Wait..." (Spinner) -> "Playing" (Equalizer) -> "Listen"
 */
async function handleVoicePreview(voice, buttonElement) {
  if (currentPreviewAudio && currentPreviewVoiceId === voice.id && !currentPreviewAudio.paused) {
    stopAllAudio();
    return;
  }

  stopAllAudio();

  // Phase 1: Show Spinner while Fetching/Loading (Text: "Wait...")
  buttonElement.classList.add("playing");
  buttonElement.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
    <span>Wait...</span>
  `;

  try {
    const cacheKey = `${voice.id}_${selectedSpeed}`;
    let audioUrl = previewCache.get(cacheKey);

    if (!audioUrl) {
      const previewText = `Hey there! I'm ${voice.name}, ready to bring your words to life.`;
      const url = `${API_ENDPOINT}?model=${encodeURIComponent(voice.model)}&speed=${selectedSpeed}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Token ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: previewText })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await fetchStreamToBlob(response);
      audioUrl = URL.createObjectURL(blob);
      previewCache.set(cacheKey, audioUrl);
    }

    const previewAudio = new Audio(audioUrl);
    previewAudio.playbackRate = selectedSpeed;
    currentPreviewAudio = previewAudio;
    currentPreviewVoiceId = voice.id;

    // Phase 2: Switch to Speaking Equalizer Bars once Playback starts (Text: "Playing")
    previewAudio.onplaying = () => {
      buttonElement.innerHTML = `
        <span class="eq-bars">
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
        </span>
        <span>Playing</span>
      `;
    };

    previewAudio.onended = () => {
      resetAllPreviewButtons();
      currentPreviewAudio = null;
      currentPreviewVoiceId = null;
    };

    await previewAudio.play();

  } catch (err) {
    console.error("Preview error:", err);
    resetAllPreviewButtons();
    setButtonFeedback("Preview error");
  }
}

function resetAllPreviewButtons() {
  document.querySelectorAll(".btn-preview").forEach((btn) => {
    btn.classList.remove("playing");
    btn.innerHTML = `
      <svg class="preview-play-icon" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <span>Listen</span>
    `;
  });
}

/**
 * Handle Speech Generation with Skeleton Shimmer Effect & In-Button Loading Text
 */
async function handleGenerate() {
  let text = textInput.value.trim();
  if (!text) {
    setButtonFeedback("Please enter text!");
    textInput.focus();
    return;
  }

  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    textInput.value = text;
    localStorage.setItem(STORAGE_TEXT, text);
    updateTextStats();
    setButtonFeedback(`Trimmed to ${MAX_CHARS} chars`);
  }

  stopAllAudio();

  const playIconInBtn = document.getElementById("icon-generate-play");
  if (playIconInBtn) playIconInBtn.classList.add("hidden");

  btnGenerate.disabled = true;
  btnGenerate.classList.add("loading");
  btnGenerateText.textContent = `${selectedVoice.name} is cooking...`;

  // Show Skeleton Shimmer State
  playerContainer.classList.remove("hidden");
  playerCardSkeleton.classList.remove("hidden");
  playerCardBody.classList.add("hidden");

  try {
    const url = `${API_ENDPOINT}?model=${encodeURIComponent(selectedVoice.model)}&speed=${selectedSpeed}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Token ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await fetchStreamToBlob(response);
    currentAudioBlob = blob;

    if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = URL.createObjectURL(blob);

    const exactDuration = await calculateBlobDuration(blob);
    const audioDataUrl = await blobToDataUrl(blob);
    const firstFive = getFirstFiveWords(text);

    // Update Main Player Card UI
    playerVoiceImg.src = selectedVoice.avatar;
    playerVoiceNameLabel.textContent = selectedVoice.name;
    playerFirstWords.textContent = `"${firstFive}"`;

    infoVoiceName.textContent = `${selectedVoice.name} (${selectedVoice.accent} ${selectedVoice.gender})`;
    infoSpeed.textContent = `${selectedSpeed}x`;
    infoSize.textContent = `${Math.round(blob.size / 1024)} KB`;

    timeTotal.textContent = formatTime(exactDuration);
    timeCurrent.textContent = "0:00";
    scrubberFill.style.width = "0%";

    // Hide Skeleton Shimmer, Reveal Actual Card
    playerCardSkeleton.classList.add("hidden");
    playerCardBody.classList.remove("hidden");

    audioElement.src = currentAudioUrl;
    audioElement.load();
    await audioElement.play();
    setPlayerPlayState(true);

    addRecentClip({
      id: Date.now(),
      firstFiveText: firstFive,
      voiceName: selectedVoice.name,
      voiceAvatar: selectedVoice.avatar,
      voiceAccent: selectedVoice.accent,
      voiceGender: selectedVoice.gender,
      speed: selectedSpeed,
      sizeKb: Math.round(blob.size / 1024),
      durationSec: exactDuration,
      fullText: text,
      audioDataUrl: audioDataUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err) {
    console.error("Generation error:", err);
    playerCardSkeleton.classList.add("hidden");
    playerContainer.classList.add("hidden");
    setButtonFeedback("Generation failed!");
  } finally {
    btnGenerate.disabled = false;
    btnGenerate.classList.remove("loading");
    if (btnGenerateText.textContent.includes("cooking")) {
      btnGenerateText.textContent = "Say It";
    }
    const playIconInBtn = document.getElementById("icon-generate-play");
    if (playIconInBtn) playIconInBtn.classList.remove("hidden");
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

async function fetchStreamToBlob(response) {
  const reader = response.body.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return new Blob(chunks, { type: "audio/mp3" });
}

async function calculateBlobDuration(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const duration = decoded.duration;
    audioCtx.close();
    return duration;
  } catch (_) {
    return 0;
  }
}

function updateSmoothProgress() {
  if (audioElement && !audioElement.paused && audioElement.duration) {
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    scrubberFill.style.width = `${progress}%`;
    timeCurrent.textContent = formatTime(audioElement.currentTime);
    animFrameId = requestAnimationFrame(updateSmoothProgress);
  }
}

function setPlayerPlayState(isPlaying) {
  cancelAnimationFrame(animFrameId);
  if (isPlaying) {
    iconPlay.classList.add("hidden");
    iconPause.classList.remove("hidden");
    animFrameId = requestAnimationFrame(updateSmoothProgress);
  } else {
    iconPlay.classList.remove("hidden");
    iconPause.classList.add("hidden");
  }
}

async function downloadAudio(format = "mp3") {
  if (!currentAudioBlob && !currentAudioUrl) {
    setButtonFeedback("No audio to download");
    return;
  }

  const filename = `audio-${selectedVoice.name.toLowerCase()}-${Date.now()}.${format}`;

  if (format === "mp3") {
    triggerFileDownload(currentAudioUrl, filename);
  } else if (format === "wav") {
    setButtonFeedback("Preparing WAV...");
    try {
      const wavBlob = await convertMp3BlobToWav(currentAudioBlob);
      const wavUrl = URL.createObjectURL(wavBlob);
      triggerFileDownload(wavUrl, filename);
    } catch (err) {
      console.error("WAV conversion error:", err);
      triggerFileDownload(currentAudioUrl, filename.replace(".wav", ".mp3"));
    }
  }
}

function triggerFileDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setButtonFeedback(`Downloading ${filename}`);
}

async function convertMp3BlobToWav(mp3Blob) {
  const arrayBuffer = await mp3Blob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * numChannels * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = audioBuffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity || !seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function makeScrubberDraggable(timelineEl, onSeek) {
  if (!timelineEl) return;
  let isDragging = false;

  const handleSeek = (e) => {
    const rect = timelineEl.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(fraction);
  };

  timelineEl.addEventListener("pointerdown", (e) => {
    isDragging = true;
    try {
      timelineEl.setPointerCapture(e.pointerId);
    } catch (_) {}
    handleSeek(e);
  });

  timelineEl.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    handleSeek(e);
  });

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      if (timelineEl.hasPointerCapture(e.pointerId)) {
        timelineEl.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
  };

  timelineEl.addEventListener("pointerup", stopDrag);
  timelineEl.addEventListener("pointercancel", stopDrag);
}

function addRecentClip(clip) {
  recentClips.unshift(clip);
  if (recentClips.length > 5) recentClips.pop();
  saveHistoryState();
  renderRecentClips();
}

function resetAllHistoryPlayButtons() {
  document.querySelectorAll(".btn-history-play").forEach((btn) => {
    const playIcon = btn.querySelector(".history-icon-play");
    const pauseIcon = btn.querySelector(".history-icon-pause");
    if (playIcon) playIcon.classList.remove("hidden");
    if (pauseIcon) pauseIcon.classList.add("hidden");
  });
}

function renderRecentClips() {
  if (recentClips.length === 0) {
    recentSection.classList.add("hidden");
    if (btnClearHistory) btnClearHistory.classList.add("hidden");
    return;
  }

  recentSection.classList.remove("hidden");
  recentCountLabel.textContent = `Recent History (${recentClips.length})`;

  if (recentHeaderBar && recentHeaderBar.classList.contains("expanded") && btnClearHistory) {
    btnClearHistory.classList.remove("hidden");
  } else if (btnClearHistory) {
    btnClearHistory.classList.add("hidden");
  }

  recentGrid.innerHTML = "";

  recentClips.forEach((clip) => {
    const avatarUrl = clip.voiceAvatar || (STUDIO_VOICES.find(v => v.name === clip.voiceName) || STUDIO_VOICES[0]).avatar;

    const card = document.createElement("div");
    card.className = "player-card pill-shape";
    card.style.backgroundColor = "var(--color-canvas-soft)";

    card.innerHTML = `
      <div class="player-top">
        <div class="player-title-row">
          <img class="player-voice-avatar" src="${avatarUrl}" alt="${clip.voiceName}">
          <div class="player-voice-details">
            <span class="player-voice-name">${clip.voiceName}</span>
            <span class="player-title">"${clip.firstFiveText}"</span>
          </div>
          <div class="info-popover-wrapper">
            <button type="button" class="btn-info-icon btn-history-info" title="Audio Info">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
            <div class="info-popover-card hidden">
              <div class="popover-line"><strong>Voice:</strong> <span>${clip.voiceName} (${clip.voiceAccent} ${clip.voiceGender})</span></div>
              <div class="popover-line"><strong>Speed:</strong> <span>${clip.speed}x</span></div>
              <div class="popover-line"><strong>Size:</strong> <span>${clip.sizeKb} KB</span></div>
            </div>
          </div>
        </div>

        <div class="history-actions-group" style="display:flex; align-items:center; gap:8px;">
          <div class="custom-dropdown-container fit-content">
            <button type="button" class="button-secondary btn-history-dl-trigger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="custom-dropdown-menu right-aligned compact-menu hidden history-dl-menu">
              <button type="button" class="dropdown-item history-dl-mp3">Download MP3</button>
              <button type="button" class="dropdown-item history-dl-wav">Download WAV</button>
            </div>
          </div>
          <button type="button" class="btn-delete-clip" data-clip-id="${clip.id}" title="Remove item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>

      <div class="custom-audio-bar">
        <button type="button" class="button-icon-circular btn-history-play" data-clip-id="${clip.id}" title="Play in History">
          <svg class="history-icon-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <svg class="history-icon-pause hidden" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
        <div class="scrubber-wrapper">
          <div class="scrubber-timeline history-timeline" data-clip-id="${clip.id}">
            <div class="scrubber-fill history-fill" id="history-fill-${clip.id}"></div>
          </div>
          <div class="time-display">
            <span class="history-time-current" id="history-time-curr-${clip.id}">0:00</span>
            <span class="history-time-total">${formatTime(clip.durationSec)}</span>
          </div>
        </div>
      </div>
    `;

    const btnHistoryInfo = card.querySelector(".btn-history-info");
    const historyInfoPopover = card.querySelector(".info-popover-card");
    btnHistoryInfo.addEventListener("click", (e) => {
      e.stopPropagation();
      historyInfoPopover.classList.toggle("hidden");
    });

    const btnHistoryDl = card.querySelector(".btn-history-dl-trigger");
    const historyDlMenu = card.querySelector(".history-dl-menu");
    btnHistoryDl.addEventListener("click", (e) => {
      e.stopPropagation();
      historyDlMenu.classList.toggle("hidden");
    });

    card.querySelector(".history-dl-mp3").addEventListener("click", () => {
      historyDlMenu.classList.add("hidden");
      if (clip.audioDataUrl) {
        triggerFileDownload(clip.audioDataUrl, `audio-${clip.voiceName.toLowerCase()}-${clip.id}.mp3`);
      } else {
        setButtonFeedback("Audio unavailable");
      }
    });

    card.querySelector(".history-dl-wav").addEventListener("click", async () => {
      historyDlMenu.classList.add("hidden");
      try {
        if (!clip.audioDataUrl) throw new Error("No data");
        const b = dataUrlToBlob(clip.audioDataUrl);
        const wavBlob = await convertMp3BlobToWav(b);
        const wavUrl = URL.createObjectURL(wavBlob);
        triggerFileDownload(wavUrl, `audio-${clip.voiceName.toLowerCase()}-${clip.id}.wav`);
      } catch (_) {
        setButtonFeedback("WAV conversion error");
      }
    });

    const btnDeleteClip = card.querySelector(".btn-delete-clip");
    if (btnDeleteClip) {
      btnDeleteClip.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeHistoryClipId === clip.id) {
          stopAllAudio();
        }
        recentClips = recentClips.filter(c => c.id !== clip.id);
        saveHistoryState();
        renderRecentClips();
      });
    }

    const btnHistoryPlay = card.querySelector(".btn-history-play");
    const playIcon = card.querySelector(".history-icon-play");
    const pauseIcon = card.querySelector(".history-icon-pause");
    const fillBar = card.querySelector(`#history-fill-${clip.id}`);
    const timeCurrLabel = card.querySelector(`#history-time-curr-${clip.id}`);
    const historyTimeline = card.querySelector(`.history-timeline`);

    btnHistoryPlay.addEventListener("click", async () => {
      if (activeHistoryClipId === clip.id && activeHistoryAudio && !activeHistoryAudio.paused) {
        stopAllAudio();
        return;
      }

      stopAllAudio();

      try {
        if (!clip.audioDataUrl) {
          setButtonFeedback("Audio data expired");
          return;
        }

        activeHistoryAudio = new Audio(clip.audioDataUrl);
        activeHistoryClipId = clip.id;

        const startPct = parseFloat(fillBar ? fillBar.style.width : "0") || 0;
        if (startPct > 0 && startPct < 100 && clip.durationSec) {
          activeHistoryAudio.currentTime = (startPct / 100) * clip.durationSec;
        }

        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");

        const updateHistoryProgress = () => {
          if (activeHistoryAudio && activeHistoryClipId === clip.id && !activeHistoryAudio.paused) {
            const prog = (activeHistoryAudio.currentTime / (activeHistoryAudio.duration || clip.durationSec)) * 100;
            if (fillBar) fillBar.style.width = `${prog}%`;
            if (timeCurrLabel) timeCurrLabel.textContent = formatTime(activeHistoryAudio.currentTime);
            historyAnimFrameId = requestAnimationFrame(updateHistoryProgress);
          }
        };

        activeHistoryAudio.onended = () => {
          playIcon.classList.remove("hidden");
          pauseIcon.classList.add("hidden");
          if (fillBar) fillBar.style.width = "0%";
          if (timeCurrLabel) timeCurrLabel.textContent = "0:00";
          activeHistoryAudio = null;
          activeHistoryClipId = null;
          cancelAnimationFrame(historyAnimFrameId);
        };

        await activeHistoryAudio.play();
        historyAnimFrameId = requestAnimationFrame(updateHistoryProgress);

      } catch (err) {
        resetAllHistoryPlayButtons();
        setButtonFeedback("Playback failed");
      }
    });

    makeScrubberDraggable(historyTimeline, (fraction) => {
      if (activeHistoryAudio && activeHistoryClipId === clip.id && activeHistoryAudio.duration) {
        activeHistoryAudio.currentTime = fraction * activeHistoryAudio.duration;
        const prog = fraction * 100;
        if (fillBar) fillBar.style.width = `${prog}%`;
        if (timeCurrLabel) timeCurrLabel.textContent = formatTime(activeHistoryAudio.currentTime);
      } else {
        const targetTime = fraction * clip.durationSec;
        if (fillBar) fillBar.style.width = `${fraction * 100}%`;
        if (timeCurrLabel) timeCurrLabel.textContent = formatTime(targetTime);
      }
    });

    recentGrid.appendChild(card);
  });
}

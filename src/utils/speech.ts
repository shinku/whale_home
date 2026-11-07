const BRITISH_FEMALE_VOICE_NAMES = [
  "google uk english female",
  "microsoft libby",
  "microsoft hazel",
  "microsoft susan",
  "kate",
  "serena",
  "stephanie",
  "sonia",
];
const FEMALE_VOICE_HINT =
  /\b(female|woman|libby|hazel|susan|sonia|kate|serena|serina|stephanie|emily|maisie|martha)\b/i;
const MALE_VOICE_HINT =
  /\b(male|man|george|daniel|arthur|oliver|ryan|thomas)\b/i;

/** 英式女声的统一听感参数：稍慢、自然音高、音量略收，整体更柔和。 */
export const BRITISH_FEMALE_SPEECH_SETTINGS = {
  lang: "en-GB",
  rate: 0.85,
  pitch: 1,
  volume: 0.9,
} as const;

export type TSpeakEnglishOptions = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (event: SpeechSynthesisErrorEvent) => void;
};

/** 当前浏览器是否支持 Web Speech API。 */
export const isSpeechSupported = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance !== "undefined";

/** 停止当前所有英文朗读。 */
export const cancelSpeech = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};

/** 依次按常见英式女声名称、女声标记、非男声、任意英式声音选择。 */
export const selectBritishFemaleVoice = (voices: SpeechSynthesisVoice[]) => {
  const britishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().replace("_", "-").startsWith("en-gb"),
  );
  if (britishVoices.length === 0) return undefined;

  for (const preferredName of BRITISH_FEMALE_VOICE_NAMES) {
    const preferred = britishVoices.find((voice) =>
      voice.name.toLowerCase().includes(preferredName),
    );
    if (preferred) return preferred;
  }

  return (
    britishVoices.find(
      (voice) =>
        FEMALE_VOICE_HINT.test(voice.name) && !MALE_VOICE_HINT.test(voice.name),
    ) ??
    britishVoices.find((voice) => !MALE_VOICE_HINT.test(voice.name)) ??
    britishVoices[0]
  );
};

/**
 * 使用浏览器 Web Speech API 朗读英文。
 * 必须由用户手势同步触发，避免部分 H5 浏览器阻止语音播放。
 */
export const speakEnglish = (
  text: string,
  options: TSpeakEnglishOptions = {},
) => {
  if (!isSpeechSupported()) {
    throw new Error("当前浏览器不支持语音朗读");
  }

  const content = text.trim();
  if (!content) return;

  cancelSpeech();
  const voice = selectBritishFemaleVoice(window.speechSynthesis.getVoices());
  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = voice?.lang || BRITISH_FEMALE_SPEECH_SETTINGS.lang;
  utterance.rate = BRITISH_FEMALE_SPEECH_SETTINGS.rate;
  utterance.pitch = BRITISH_FEMALE_SPEECH_SETTINGS.pitch;
  utterance.volume = BRITISH_FEMALE_SPEECH_SETTINGS.volume;
  if (voice) utterance.voice = voice;
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (event) => options.onError?.(event);

  window.speechSynthesis.speak(utterance);
  options.onStart?.();
};

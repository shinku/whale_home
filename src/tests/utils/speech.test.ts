import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  BRITISH_FEMALE_SPEECH_SETTINGS,
  selectBritishFemaleVoice,
  speakEnglish,
} from "@/utils/speech";

const voice = (name: string, lang: string) =>
  ({ name, lang }) as SpeechSynthesisVoice;

describe("speakEnglish", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
  });

  it("浏览器不支持时给出明确错误", () => {
    expect(() => speakEnglish("hero")).toThrow("当前浏览器不支持语音朗读");
  });

  it("使用英式女声并应用柔和的语速、音高和音量", () => {
    const speak = jest.fn();
    const britishVoice = voice("Google UK English Female", "en-GB");

    class MockSpeechSynthesisUtterance {
      lang = "";
      rate = 1;
      pitch = 1;
      volume = 1;
      voice?: SpeechSynthesisVoice;
      onend?: () => void;
      onerror?: (event: SpeechSynthesisErrorEvent) => void;

      constructor(public text: string) {}
    }

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        speechSynthesis: {
          cancel: jest.fn(),
          getVoices: () => [britishVoice],
          speak,
        },
      },
    });
    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });

    speakEnglish("  Hello  ");

    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0]).toMatchObject({
      ...BRITISH_FEMALE_SPEECH_SETTINGS,
      text: "Hello",
      voice: britishVoice,
    });
  });
});

describe("selectBritishFemaleVoice", () => {
  it("优先选择英国口音的女生声音", () => {
    const selected = selectBritishFemaleVoice([
      voice("Samantha", "en-US"),
      voice("Daniel", "en-GB"),
      voice("Google US English Female", "en-US"),
      voice("Google UK English Female", "en-GB"),
    ]);

    expect(selected?.name).toBe("Google UK English Female");
  });

  it("支持常见的英式女声名称", () => {
    const selected = selectBritishFemaleVoice([
      voice("Daniel", "en-GB"),
      voice(
        "Microsoft Libby Online (Natural) - English (United Kingdom)",
        "en_GB",
      ),
    ]);

    expect(selected?.name).toContain("Libby");
  });

  it("没有明确女声名称时排除男声，并最终回退到英式声音", () => {
    expect(
      selectBritishFemaleVoice([
        voice("Daniel", "en-GB"),
        voice("English United Kingdom", "en-GB"),
      ])?.name,
    ).toBe("English United Kingdom");

    expect(selectBritishFemaleVoice([voice("Daniel", "en-GB")])?.name).toBe(
      "Daniel",
    );
    expect(
      selectBritishFemaleVoice([voice("Samantha", "en-US")]),
    ).toBeUndefined();
  });
});

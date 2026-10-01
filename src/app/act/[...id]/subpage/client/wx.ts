import { miniProgramNavigateTo } from "@/utils/wx";

export const jumpBakToMini = (list: { name: string; link: string }[]) => {
  miniProgramNavigateTo(
    "/pages/converResult/covert-result-page?list=" + JSON.stringify(list),
  );
};

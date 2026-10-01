type TLisencePath = string | {
    "path": string | TLisencePath;
}
export const lisencedPaths:TLisencePath[] = ['edu'] as const
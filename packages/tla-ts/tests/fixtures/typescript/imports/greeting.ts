import * as english from "./english.ts";
import * as latin from "./latin.ts";

export const pickGreeting = (isLatin: boolean) => (isLatin ? latin : english);

export const latinNames = Object.keys(latin).join();

import * as english from "./english";
import * as latin from "./latin";

export const pickGreeting = (isLatin: boolean) => (isLatin ? latin : english);

export const latinNames = Object.keys(latin).join();

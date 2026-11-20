export const trimJava = (text: string) => text.replace(/^[\0-\x20]+|[\0-\x20]+$/g, "");

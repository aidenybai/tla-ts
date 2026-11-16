import { Kind } from "./kinds";

enum Color {
  Red,
  Green = 5,
  Blue,
}
const getName = (value: number) => Color[value];
const table: Record<string, unknown> = Kind;
const seen = [
  Object.keys(Color).join(),
  Object.values(Kind).join(),
  getName(6),
  Kind[2],
  table["Named"],
  Kind.Second,
  JSON.stringify(Color),
].join(";");
if (
  seen !==
  '0,5,6,Red,Green,Blue;First,Second,Last,1,2,named,10;Blue;Second;named;2;{"0":"Red","5":"Green","6":"Blue","Red":0,"Green":5,"Blue":6}'
)
  throw new Error("seen " + seen);

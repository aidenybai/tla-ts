// A port of AsynchInterface.tla from Specifying Systems in tlaplus/Examples.
type Data = "d1" | "d2" | "d3";

let val: Data;
let rdy!: 0 | 1;
let ack = rdy;

export const send = (data: Data) => {
  if (rdy !== ack) return;
  val = data;
  rdy = rdy === 0 ? 1 : 0;
};

export const rcv = () => {
  if (rdy === ack) return;
  ack = ack === 0 ? 1 : 0;
};

export const typeInvariant = () =>
  (val === "d1" || val === "d2" || val === "d3") &&
  (rdy === 0 || rdy === 1) &&
  (ack === 0 || ack === 1);

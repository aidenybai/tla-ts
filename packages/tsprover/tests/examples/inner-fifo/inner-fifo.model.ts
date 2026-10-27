// A port of InnerFIFO.tla from Specifying Systems in tlaplus/Examples, with MCInnerFIFO's queue
// bound. TypeScript reserves `in`, so the input channel is `input`.
type Message = "m1" | "m2" | "m3";

interface Channel {
  val: Message;
  rdy: 0 | 1;
  ack: 0 | 1;
}

let input: Channel;
let output: Channel;
let q: Message[] = [];

/** @initially */
export const isIdle = () => input.ack === input.rdy && output.ack === output.rdy;

const flip = (bit: 0 | 1) => (bit === 0 ? 1 : 0);

export const sSend = (msg: Message) => {
  if (input.rdy !== input.ack) return;
  input = { ...input, val: msg, rdy: flip(input.rdy) };
};

export const bufRcv = () => {
  if (input.rdy === input.ack) return;
  input.ack = flip(input.ack);
  q.push(input.val);
};

export const bufSend = () => {
  if (q.length === 0 || output.rdy !== output.ack) return;
  output = { ...output, val: q[0], rdy: flip(output.rdy) };
  q.shift();
};

export const rRcv = () => {
  if (output.rdy === output.ack) return;
  output.ack = flip(output.ack);
};

/** @constraint */
export const qConstraint = () => q.length <= 3;

// A port of Channel.tla from Specifying Systems in tlaplus/Examples.
type Data = "d1" | "d2";

let chan: { val: Data; rdy: 0 | 1; ack: 0 | 1 };

/** @initially */
export const isIdle = () => chan.ack === chan.rdy;

export const send = (data: Data) => {
  if (chan.rdy !== chan.ack) return;
  chan = { ...chan, val: data, rdy: chan.rdy === 0 ? 1 : 0 };
};

export const rcv = () => {
  if (chan.rdy === chan.ack) return;
  chan.ack = chan.ack === 0 ? 1 : 0;
};

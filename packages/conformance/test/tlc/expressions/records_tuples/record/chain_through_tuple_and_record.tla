(*---
description: "Selection and application chain."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rs"
flags: [expression]
outcome: success
---*)
---- MODULE chain_through_tuple_and_record ----
EXTENDS Integers
Test == [a |-> [b |-> <<1, [c |-> 2]>>]].a.b[2].c = 2
====

(*--- recorded
all:
  exit: 0
---*)

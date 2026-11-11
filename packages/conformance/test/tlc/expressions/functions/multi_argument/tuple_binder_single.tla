(*---
description: "A tuple binder takes one tuple argument."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_single ----
EXTENDS Integers
Test == [<<a, b>> \in {<<1, 2>>} |-> a + b][<<1, 2>>] = 3
====

(*--- recorded
all:
  exit: 0
---*)

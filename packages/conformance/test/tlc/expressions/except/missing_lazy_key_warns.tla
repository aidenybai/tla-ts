(*---
description: "A key outside a lazy function leaves it lazy and unchanged."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE missing_lazy_key_warns ----
EXTENDS Integers
Test == [[x \in Nat |-> x] EXCEPT ![-1] = 0][1] = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 10 to line 9, col 26 of module missing_lazy_key_warns
---*)

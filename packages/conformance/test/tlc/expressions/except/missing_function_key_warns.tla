(*---
description: "A key outside a function record leaves it unchanged."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE missing_function_key_warns ----
EXTENDS Integers, TLC
Test == [(1 :> 2) EXCEPT ![3] = 0] = (1 :> 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 11 to line 9, col 16 of module missing_function_key_warns
---*)

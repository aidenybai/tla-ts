(*---
description: "A clause with a missing key does not stop the next clause."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE missing_then_valid_clause ----
EXTENDS Integers
Test == [<<1>> EXCEPT ![5] = 0, ![1] = 2] = <<2>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 10 to line 9, col 14 of module missing_then_valid_clause
---*)

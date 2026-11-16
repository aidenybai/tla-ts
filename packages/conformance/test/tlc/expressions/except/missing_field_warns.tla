(*---
description: "A missing field leaves the record unchanged and prints the warning."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE missing_field_warns ----
EXTENDS Integers
Test == [[a |-> 1] EXCEPT !.b = 0] = [a |-> 1]
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 10 to line 9, col 18 of module missing_field_warns
---*)

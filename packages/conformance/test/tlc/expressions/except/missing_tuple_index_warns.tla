(*---
description: "A path outside a tuple leaves it unchanged and prints the warning, which is the only sign of it."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE missing_tuple_index_warns ----
EXTENDS Integers
Test == [<<1>> EXCEPT ![5] = 0] = <<1>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 10 to line 9, col 14 of module missing_tuple_index_warns
---*)

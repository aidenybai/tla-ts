(*---
description: "A path outside a tuple skips the new value, so its error does not surface."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE missing_tuple_index_skips_value ----
EXTENDS Integers
Test == [<<1>> EXCEPT ![5] = 1 \div 0] = <<1>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 9, col 10 to line 9, col 14 of module missing_tuple_index_skips_value
---*)

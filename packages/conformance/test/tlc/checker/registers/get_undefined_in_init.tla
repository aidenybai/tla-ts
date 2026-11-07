(*---
description: TLCGet of an index that was never set fails in Init.
ref: tlc2/module/TLCGetSet.java#TLCGet
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE get_undefined_in_init ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = TLCGet(1)
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2145:0 TLCGet(1) was undefined.
    2145:0 TLCGet(1) was undefined.
    2145:0 TLCGet(1) was undefined.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 21 in get_undefined_in_init
    1. Line 12, column 13 to line 12, column 21 in get_undefined_in_init
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

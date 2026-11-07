(*---
description: TLCGet of an index that was never set fails with the undefined message.
ref: tlc2/module/TLCGetSet.java#TLCGet
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE get_undefined_index ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3 /\ PrintT(TLCGet(7))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2145:0 TLCGet(7) was undefined.
    2145:0 TLCGet(7) was undefined.
    2145:0 TLCGet(7) was undefined.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 45 in get_undefined_index
    1. Line 13, column 9 to line 13, column 24 in get_undefined_index
    2. Line 13, column 29 to line 13, column 45 in get_undefined_index
    3. Line 13, column 36 to line 13, column 44 in get_undefined_index
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

(*---
description: TLCSet with a set as index fails with the argument error.
ref: tlc2/module/TLCGetSet.java#TLCSet
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE set_set_index ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3 /\ TLCSet({1}, 0)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2169:1 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    {1}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 42 in set_set_index
    1. Line 13, column 9 to line 13, column 24 in set_set_index
    2. Line 13, column 29 to line 13, column 42 in set_set_index
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

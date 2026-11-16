(*---
description: 'An INIT that is itself a whole spec fails evaluation of its box.'
ref: tlc2/tool/impl/Tool.java#getInitStates
features: [liveness, levels]
outcome: evaluation-failure
config: |
  INIT I
  NEXT Next
---*)
---- MODULE tlc_init_box_via_config ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
I == x = 0 /\ [](x = 0)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2261:0 TLC encountered a temporal formula ([]A) when evaluating a predicate or action.
    line 15, col 15 to line 15, col 23 of module tlc_init_box_via_config
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 6 to line 15, column 23 in tlc_init_box_via_config
    1. Line 15, column 6 to line 15, column 10 in tlc_init_box_via_config
    2. Line 15, column 15 to line 15, column 23 in tlc_init_box_via_config
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

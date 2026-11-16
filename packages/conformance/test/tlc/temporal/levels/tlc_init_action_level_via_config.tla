(*---
description: 'An INIT with a primed variable passes SANY and fails evaluation.'
ref: tlc2/tool/impl/Tool.java#getInitStates
features: [liveness, levels]
outcome: evaluation-failure
config: |
  INIT I
  NEXT Next
---*)
---- MODULE tlc_init_action_level_via_config ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
I == x' = 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 15, col 6 to line 15, col 6 of module tlc_init_action_level_via_config
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 6 to line 15, column 11 in tlc_init_action_level_via_config
    1. Line 15, column 6 to line 15, column 7 in tlc_init_action_level_via_config
    2. Line 15, column 6 to line 15, column 6 in tlc_init_action_level_via_config
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

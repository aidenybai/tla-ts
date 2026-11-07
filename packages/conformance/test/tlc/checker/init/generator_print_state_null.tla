(*---
description: PrintT of an unassigned variable during generation fails, because evaluating the variable fails.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE generator_print_state_null ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = 1 /\ PrintT(y) /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 13, col 25 to line 13, col 25 of module generator_print_state_null
    2280:0 In evaluation, the identifier y is either undefined or not an operator.
    line 13, col 25 to line 13, col 25 of module generator_print_state_null
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 35 in generator_print_state_null
    1. Line 13, column 9 to line 13, column 26 in generator_print_state_null
    2. Line 13, column 9 to line 13, column 13 in generator_print_state_null
    3. Line 13, column 18 to line 13, column 26 in generator_print_state_null
    4. Line 13, column 25 to line 13, column 25 in generator_print_state_null
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

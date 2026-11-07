(*---
description: "A definition that reads a variable fails only when reached, with the state printed."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  INVARIANT Inv
---*)
---- MODULE non_constant_definition_error_reported_in_state ----
EXTENDS Integers
VARIABLE x
Bad == 1 \div x
Init == x = 0
Next == UNCHANGED x
Inv == Bad = 0
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in non_constant_definition_error_reported_in_state
    1. Line 15, column 8 to line 15, column 14 in non_constant_definition_error_reported_in_state
    2. Line 15, column 8 to line 15, column 10 in non_constant_definition_error_reported_in_state
    3. Line 12, column 8 to line 12, column 15 in non_constant_definition_error_reported_in_state
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

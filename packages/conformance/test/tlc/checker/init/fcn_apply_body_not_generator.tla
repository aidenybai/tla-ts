(*---
description: A constant-level function definition evaluates its lambda body when SpecProcessor or apply forces it, so a body reading x fails on the unassigned x rather than assigning it.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_fa
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE fcn_apply_body_not_generator ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
F == [i \in 1..2 |-> x = i]
Init == F[2] /\ PrintT(x)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 22 to line 13, col 22 of module fcn_apply_body_not_generator
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 22 to line 13, col 22 of module fcn_apply_body_not_generator
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 22 to line 13, col 22 of module fcn_apply_body_not_generator
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 22 to line 13, col 22 of module fcn_apply_body_not_generator
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)

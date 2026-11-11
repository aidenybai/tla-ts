(*---
description: Explores init disjunction and next tuple_prime with check view.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  VIEW View
---*)
---- MODULE space_disjunction__tuple_prime__view ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == (x = 0 \/ x = 1) /\ y = 0
Next == <<x, y>>' = <<x, y>>
View == 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2191:0 Finished computing initial states: 2 states generated, with 1 of them distinct at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 11 to line 19, col 11 of module space_disjunction__tuple_prime__view
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 28 in space_disjunction__tuple_prime__view
    1. Line 19, column 9 to line 19, column 17 in space_disjunction__tuple_prime__view
    2. Line 19, column 9 to line 19, column 16 in space_disjunction__tuple_prime__view
    3. Line 19, column 11 to line 19, column 11 in space_disjunction__tuple_prime__view
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

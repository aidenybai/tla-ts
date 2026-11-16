(*---
description: An alias whose evaluation fails in one state prints that state's variables and the _ALIASEvalError field, and the alias in the others.
ref: tlc2/tool/impl/Tool.java#evalAlias
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE eval_error_on_some_states ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [d |-> 1 \div (x - 1)]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    d = -1
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module eval_error_on_some_states>
    /\ x = 1
    /\ _ALIASEvalError = "
    "
    2179:0 \nThe second argument of \\div is 0.\n
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module eval_error_on_some_states>
    d = 1
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

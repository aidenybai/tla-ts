(*---
description: "An ALIAS naming an operator with arguments doesn't stop the run: each trace state gets an _ALIASEvalError field with the message for arguments."
ref: tlc2/tool/impl/Spec.java#getAliasSpec
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE error_with_args ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A(a) == [p |-> a]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ _ALIASEvalError = "
    "
    2228:0 \nTLC requires alias not to take any argument, but one was given: A\n
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module error_with_args>
    /\ x = 1
    /\ _ALIASEvalError = "
    "
    2228:0 \nTLC requires alias not to take any argument, but one was given: A\n
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module error_with_args>
    /\ x = 2
    /\ _ALIASEvalError = "
    "
    2228:0 \nTLC requires alias not to take any argument, but one was given: A\n
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

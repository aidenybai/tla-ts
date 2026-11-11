(*---
description: "An ALIAS name that is with arguments doesn't stop the run: TLC catches the error while printing the trace and shows it as the value of a variable called _ALIASEvalError."
ref: tlc2/tool/impl/Spec.java#getAliasSpec
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  ALIAS A
  INVARIANT Inv
---*)
---- MODULE alias_with_trace ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A(p) == x = p
Inv == x = 0
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
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module alias_with_trace>
    /\ x = 1
    /\ _ALIASEvalError = "
    "
    2228:0 \nTLC requires alias not to take any argument, but one was given: A\n
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

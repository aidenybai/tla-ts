(*---
description: A constant record alias fails the alias check for constants, so every trace state prints its variables and an _ALIASEvalError field with that message.
ref: tlc2/tool/impl/Spec.java#getAliasSpec
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE constant_alias ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [c |-> "same"]
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
    /\ _ALIASEvalError = "@!@!@STARTMSG 2233:0 @!@!@\nThe alias A cannot be a constant.\n@!@!@ENDMSG 2233 @!@!@"
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module constant_alias>
    /\ x = 1
    /\ _ALIASEvalError = "@!@!@STARTMSG 2233:0 @!@!@\nThe alias A cannot be a constant.\n@!@!@ENDMSG 2233 @!@!@"
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module constant_alias>
    /\ x = 2
    /\ _ALIASEvalError = "@!@!@STARTMSG 2233:0 @!@!@\nThe alias A cannot be a constant.\n@!@!@ENDMSG 2233 @!@!@"
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

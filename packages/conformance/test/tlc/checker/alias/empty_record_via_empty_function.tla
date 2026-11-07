(*---
description: A constant function with an empty domain as alias fails the alias check for constants, adding the _ALIASEvalError field to each state.
ref: tlc2/value/impl/RecordValue.java#toState
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE empty_record_via_empty_function ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [k \in {} |-> k]
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
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module empty_record_via_empty_function>
    /\ x = 1
    /\ _ALIASEvalError = "@!@!@STARTMSG 2233:0 @!@!@\nThe alias A cannot be a constant.\n@!@!@ENDMSG 2233 @!@!@"
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module empty_record_via_empty_function>
    /\ x = 2
    /\ _ALIASEvalError = "@!@!@STARTMSG 2233:0 @!@!@\nThe alias A cannot be a constant.\n@!@!@ENDMSG 2233 @!@!@"
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

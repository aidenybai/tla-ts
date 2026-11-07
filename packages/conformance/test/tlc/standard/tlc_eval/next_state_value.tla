(*---
description: TLCEval's value can be assigned to a variable, and the state holds the enumerated form.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE next_state_value ----
EXTENDS TLC, Naturals
VARIABLE x
Init == x = TLCEval(1..2)
Next == x' = TLCEval(SUBSET {1})
Inv == TLCGet("level") < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = {1, 2}
    2217:4 2: <Next line 16, col 9 to line 16, col 32 of module next_state_value>
    x = {{}, {1}}
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

(*---
description: An invariant replaced by another definition in the config uses the replacement and reports the original name.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT Inv <- Other
---*)
---- MODULE config_replacement_op ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == TRUE /\ x >= 0
Other == x < 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module config_replacement_op>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

(*---
description: 'ENABLED in a property under simulation.'
ref: tlc2/tool/liveness/LiveCheck1.java#checkTrace
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_enabled_in_property ----
EXTENDS Naturals
VARIABLE x
Next == x' = (x + 1) % 3
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == []<>ENABLED Next
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(8) at <date>: 49 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(8) at <date>: 49 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 49
    Simulation using seed 4 and aril 0
---*)

(*---
description: A liveness violation in simulation is reported by the live checker with its own summary.
ref: tlc2/tool/Simulator.java#simulate
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -simulate
  - num=1
  - -depth
  - "3"
---*)
---- MODULE liveness_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Spec == Init /\ [][Next]_x
Prop == <>(x = 1)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module liveness_violation>
    x = 0
    2218:4 2: Stuttering
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 4
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
---*)

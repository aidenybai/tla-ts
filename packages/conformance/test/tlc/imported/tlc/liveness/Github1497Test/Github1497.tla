(*---
description: Ported from TLC's Github1497Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/Github1497Test.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -simulate
  - num=10
  - -depth
  - "10"
  - -deadlock
---*)
---- MODULE Github1497 ----
VARIABLE x

Init == x = 0
Next == x' = 1

Spec == Init /\ [][Next]_x

Prop == <>[](x = 0)
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
    2217:4 1: <Init line 20, col 9 to line 20, col 13 of module Github1497>
    x = 0
    2217:4 2: <Next line 21, col 9 to line 21, col 14 of module Github1497>
    x = 1
    2218:4 3: Stuttering
    2209:0 Progress(1) at <date>: 11 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 11
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 11 states generated, -1 distinct states found, -1 states left on queue.
---*)

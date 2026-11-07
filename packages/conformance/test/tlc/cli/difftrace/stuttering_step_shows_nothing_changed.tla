(*---
description: In a trace that ends by stuttering, -difftrace still shows the stuttering state.
ref: tlc2/output/StatePrinter.java#printStutteringState
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -difftrace
  - -deadlock
---*)
---- MODULE stuttering_step_shows_nothing_changed ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ UNCHANGED y
Spec == Init /\ [][Next]_<<x, y>>
Prop == <>(x = 9)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 42 of module stuttering_step_shows_nothing_changed>
    /\ x = 1
    2218:4 3: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

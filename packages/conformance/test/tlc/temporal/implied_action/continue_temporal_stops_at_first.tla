(*---
description: '-continue does not apply to the temporal check, which reports one counterexample.'
ref: tlc2/tool/liveness/LiveWorker.java#printTrace
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -continue
---*)
---- MODULE continue_temporal_stops_at_first ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == <>(x = 99)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 4 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module continue_temporal_stops_at_first>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 27 of module continue_temporal_stops_at_first>
    x = 2
    2217:4 4: <Next line 16, col 9 to line 16, col 27 of module continue_temporal_stops_at_first>
    x = 3
    2218:4 5: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)

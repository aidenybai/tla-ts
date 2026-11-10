(*---
description: 'BUG: the SCC needs a stuttering edge for an AE action on x'' = x plus visits to both states, but the printed lasso drops the stutter, so findViolatedProperties evaluates the property as true on it, finds nothing, and TLC prints the unnamed ''Temporal properties were violated.'' that MP calls a precaution for an incomplete fix.'
ref: tlc2/tool/liveness/Liveness.java#findViolatedProperties
features: [liveness, tlc-bug]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE attribution_dropped_stutter_unnamed ----
EXTENDS Naturals
VARIABLE x
Next == x' = 1 - x
Spec == x = 0 /\ [][Next]_x
Prop == <>[](LET a == x' # x IN a) \/ <>[](x = 0) \/ <>[](x = 1)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal properties were violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module attribution_dropped_stutter_unnamed>
    x = 1
    2122:4 1: Back to state: <Next line 14, col 9 to line 14, col 18 of module attribution_dropped_stutter_unnamed>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

(*---
description: 'Three violated properties print with commas and a final ''and''.'
ref: tlc2/tool/liveness/Liveness.java#findViolatedProperties
features: [liveness]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY P1 P2 P3
  CHECK_DEADLOCK FALSE
---*)
---- MODULE three_properties_all_violated ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
P1 == <>(x = 97)
P2 == <>(x = 98)
P3 == <>(x = 99)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 3 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 9 total distinct states at (<date>)
    2116:1 Temporal properties P1, P2, and P3 were violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module three_properties_all_violated>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 27 of module three_properties_all_violated>
    x = 2
    2218:4 4: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

(*---
description: PROPERTY and PROPERTIES share one list, so the false property under the plural spelling is checked.
ref: tlc2/tool/impl/ModelConfig.java#ModelConfig
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY A
  PROPERTIES B
---*)
---- MODULE property_and_properties_share_a_list ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
A == <>(x = 2)
B == <>(x = 9)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 6 total distinct states at (<date>)
    2116:1 Temporal properties A and B were violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module property_and_properties_share_a_list>
    x = 1
    2218:4 3: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)

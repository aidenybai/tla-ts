(*---
description: 'With two implied actions failing on the same step, the first in config order is reported.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY P2 P1
  CHECK_DEADLOCK FALSE
---*)
---- MODULE two_properties_first_listed_fails ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
P1 == [][x' = x]_x
P2 == [][x' = 99]_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property P2 is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module two_properties_first_listed_fails>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)

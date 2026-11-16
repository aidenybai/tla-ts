(*---
description: 'Implied actions are checked on each successor, and the terminal deadlock is reported only with no violation.'
ref: tlc2/tool/Worker.java#doNext
features: [liveness, implied-action]
outcome: deadlock
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE deadlock_detected_after_implied_checks ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [][x' = x + 1]_x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 27 of module deadlock_detected_after_implied_checks>
    x = 1
    2217:4 3: <Next line 13, col 9 to line 13, col 27 of module deadlock_detected_after_implied_checks>
    x = 2
    2217:4 4: <Next line 13, col 9 to line 13, col 27 of module deadlock_detected_after_implied_checks>
    x = 3
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)

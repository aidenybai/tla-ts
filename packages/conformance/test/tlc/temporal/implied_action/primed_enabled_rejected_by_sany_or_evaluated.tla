(*---
description: 'A primed ENABLED evaluates on the second state, which is false at the terminal step.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE primed_enabled_rejected_by_sany_or_evaluated ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [][(ENABLED Next)']_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module primed_enabled_rejected_by_sany_or_evaluated>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 27 of module primed_enabled_rejected_by_sany_or_evaluated>
    x = 2
    2217:4 4: <Next line 14, col 9 to line 14, col 27 of module primed_enabled_rejected_by_sany_or_evaluated>
    x = 3
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)

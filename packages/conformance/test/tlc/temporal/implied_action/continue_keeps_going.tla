(*---
description: 'With -continue, each implied-action violation is printed and exploration goes on to the end; as TLC''s own ContinueTest expects, the run ends with exit 0.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -continue
---*)
---- MODULE continue_keeps_going ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [][x' = 99]_x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module continue_keeps_going>
    x = 1
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module continue_keeps_going>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 27 of module continue_keeps_going>
    x = 2
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module continue_keeps_going>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 27 of module continue_keeps_going>
    x = 2
    2217:4 4: <Next line 16, col 9 to line 16, col 27 of module continue_keeps_going>
    x = 3
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

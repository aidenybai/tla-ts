(*---
description: 'With -continue, a []P property reports at each violating state and exploration goes on to the end. This is a TLC bug: with -continue a violation is printed but never recorded as the run''s error, so TLC also prints that no error was found and exits 0, as its own ContinueTest expects.'
ref: tlc2/tool/Worker.java#doNextCheckInvariants
features:
  - liveness
  - implied-action
  - tlc-bug
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -continue
correct:
  all:
    exit: 12
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2110:1 Invariant Prop is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      x = 0
      2217:4 2: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
      x = 1
      2217:4 3: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
      x = 2
      2110:1 Invariant Prop is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      x = 0
      2217:4 2: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
      x = 1
      2217:4 3: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
      x = 2
      2217:4 4: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
      x = 3
      2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 4.
---*)
---- MODULE continue_invariant_from_box ----
EXTENDS Naturals
VARIABLE x
Next == x < 3 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == [](x < 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
    x = 1
    2217:4 3: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
    x = 2
    2110:1 Invariant Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
    x = 1
    2217:4 3: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
    x = 2
    2217:4 4: <Next line 44, col 9 to line 44, col 27 of module continue_invariant_from_box>
    x = 3
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

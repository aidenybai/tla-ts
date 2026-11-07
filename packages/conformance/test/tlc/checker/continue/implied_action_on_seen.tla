(*---
description: "-continue reports an implied action violated on a step to a seen state. This is a TLC bug: with -continue a violation is printed but never recorded as the run's error, so TLC also prints that no error was found and exits 0."
ref: tlc2/tool/ModelChecker.java#doNextCheckImplied
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
args:
  - -continue
---*)
---- MODULE implied_action_on_seen ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 - x
Prop == [][x' = 1]_x
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
    2217:4 2: <Next line 18, col 9 to line 18, col 18 of module implied_action_on_seen>
    x = 1
    2217:4 3: <Next line 18, col 9 to line 18, col 18 of module implied_action_on_seen>
    x = 0
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

(*---
description: "A POSTCONDITION runs at the end of a -continue run with violations. This is a TLC bug: with -continue a violation is printed but never recorded as the run's error, so TLC also prints that no error was found and exits 0."
ref: tlc2/tool/ModelChecker.java#doNextCheckInvariants
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
args:
  - -continue
---*)
---- MODULE postcondition_after_violations ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x < 2 THEN x + 1 ELSE x
Inv == x = 0
Post == PrintT(<<"post", TLCGet("level")>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 39 of module postcondition_after_violations>
    x = 1
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 39 of module postcondition_after_violations>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 39 of module postcondition_after_violations>
    x = 2
    | <<"post", 0>>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

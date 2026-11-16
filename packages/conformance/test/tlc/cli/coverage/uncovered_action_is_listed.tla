(*---
description: An action that never fires is listed with a count of zero.
ref: tlc2/tool/coverage/OpApplNodeWrapper.java
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -coverage
  - "1"
---*)
---- MODULE uncovered_action_is_listed ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
A == x' = 0
B == x = 9 /\ x' = 1
Next == A \/ B
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2201:0 The coverage statistics at <date> (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).
    2779:0 <x line 14, col 10 to line 14, col 10 of module uncovered_action_is_listed>: 0
    2773:0 <Init line 15, col 1 to line 15, col 4 of module uncovered_action_is_listed>: 1:1
    2221:0   line 15, col 9 to line 15, col 13 of module uncovered_action_is_listed: 1
    2772:0 <A line 16, col 1 to line 16, col 1 of module uncovered_action_is_listed>: 0:1
    2221:0   line 16, col 6 to line 16, col 11 of module uncovered_action_is_listed: 1
    2772:0 <B line 17, col 1 to line 17, col 1 of module uncovered_action_is_listed>: 0:0
    2221:0   line 17, col 6 to line 17, col 10 of module uncovered_action_is_listed: 1
    2221:0   line 17, col 15 to line 17, col 20 of module uncovered_action_is_listed: 0
    2202:0 End of statistics.
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)

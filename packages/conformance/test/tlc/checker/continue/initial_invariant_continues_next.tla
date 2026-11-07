(*---
description: "-continue explores the good initial states after a bad one. This is a TLC bug: with -continue a violation is printed but never recorded as the run's error, so TLC also prints that no error was found and exits 0."
ref: tlc2/tool/ModelChecker.java#doInit
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -continue
---*)
---- MODULE initial_invariant_continues_next ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 1}
Next == x' = (x + 2) % 4
Inv == x # 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 1
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.3E-19
    2199:0 6 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)

(*---
description: If the constraint excludes every initial state, model checking finishes with generated initial states and no distinct states.
ref: tlc2/tool/ModelChecker.java#DoInitFunctor.addElement
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE all_initial_excluded ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {5, 6}
Next == x' = x
Con == x < 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2191:0 Finished computing initial states: 2 states generated, with 0 of them distinct at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 2 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

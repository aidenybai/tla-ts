(*---
description: In model checking, a state outside a CONSTRAINT is still a state, just not explored further.
ref: tlc2/tool/ModelChecker.java#doInit
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
---*)
---- MODULE model_checking_keeps_the_state ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x
Con == x > 0
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2191:0 Finished computing initial states: 1 state generated, with 0 of them distinct at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)

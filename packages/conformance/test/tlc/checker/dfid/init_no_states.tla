(*---
description: Under -dfid an Init with no states succeeds over zero states.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE init_no_states ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {}
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 0 states generated, with 0 of them distinct.
    2205:0 Starting level 2: 0 states generated, 0 distinct states found.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
      based on the actual fingerprints:  val = 0.0
    2206:0 Progress(-1) at <date>: 0 states generated, 0 distinct states found, -1 states left on queue.
    2204:0 0 states generated, 0 distinct states found.
---*)

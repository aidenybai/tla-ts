(*---
description: -dfid drops duplicate initial states from the distinct count.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE initial_duplicates ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 \/ x = 0 \/ x = 1
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 3 states generated, with 2 of them distinct.
    2205:0 Starting level 2: 3 states generated, 2 distinct states found.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.3E-19
      based on the actual fingerprints:  val = 2.9E-19
    2206:0 Progress(-1) at <date>: 5 states generated, 2 distinct states found, -1 states left on queue.
    2204:0 5 states generated, 2 distinct states found.
---*)

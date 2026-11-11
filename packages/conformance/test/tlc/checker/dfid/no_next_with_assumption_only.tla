(*---
description: With an INIT and no NEXT, -dfid reports success after the initial states.
ref: tlc2/tool/DFIDModelChecker.java#modelCheck
outcome: success
config: |
  INIT Init
args:
  - -dfid
  - "10"
---*)
---- MODULE no_next_with_assumption_only ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
      based on the actual fingerprints:  val = 1.1E-19
    2206:0 Progress(-1) at <date>: 1 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 1 states generated, 1 distinct states found.
---*)

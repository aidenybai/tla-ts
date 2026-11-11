(*---
description: A VIEW merges states under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
  VIEW V
args:
  - -dfid
  - "10"
---*)
---- MODULE view_merges ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 4
V == x % 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
      based on the actual fingerprints:  val = 2.9E-19
    2206:0 Progress(-1) at <date>: 4 states generated, 2 distinct states found, -1 states left on queue.
    2204:0 4 states generated, 2 distinct states found.
---*)

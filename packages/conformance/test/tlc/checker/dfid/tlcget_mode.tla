(*---
description: TLCGet("config").mode is bfs under -dfid, because DFID uses the same config record as breadth-first search.
ref: tlc2/tool/AbstractChecker.java#getConfig
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE tlcget_mode ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ PrintT(TLCGet("config").mode)
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "bfs"
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
      based on the actual fingerprints:  val = 1.1E-19
    2206:0 Progress(-1) at <date>: 2 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 2 states generated, 1 distinct states found.
---*)

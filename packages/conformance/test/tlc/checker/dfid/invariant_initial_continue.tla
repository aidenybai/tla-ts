(*---
description: "With -continue, -dfid keeps going after an initial state violates an invariant. This is a TLC bug: with -continue a violation is printed but never recorded as the run's error, so TLC also prints that no error was found and exits 0."
ref: tlc2/tool/DFIDModelChecker.java#doInit
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -dfid
  - "10"
  - -continue
---*)
---- MODULE invariant_initial_continue ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
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

(*---
description: "With -continue, -dfid prints every violating state and runs on until the limit. This is a TLC bug: with -continue a violation is printed but never recorded as the run's error, so TLC also prints that no error was found and exits 0."
ref: tlc2/tool/DFIDModelChecker.java#doNext
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -dfid
  - "5"
  - -continue
correct:
  all:
    exit: 12
    transcript: |-
      2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
      2205:0 Starting level 2: 1 states generated, 1 distinct states found.
      2110:1 Invariant Inv is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: 
      x = 0
      2217:4 2: 
      x = 1
      2205:0 Starting level 3: 2 states generated, 2 distinct states found.
      2110:1 Invariant Inv is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: 
      x = 0
      2217:4 2: 
      x = 1
      2217:4 3: 
      x = 2
      2205:0 Starting level 4: 4 states generated, 3 distinct states found.
      2206:0 Progress(-1) at <date>: 7 states generated, 3 distinct states found, -1 states left on queue.
      2204:0 7 states generated, 3 distinct states found.
---*)
---- MODULE invariant_next_continue ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = IF x < 2 THEN x + 1 ELSE x
Inv == x < 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: 
    x = 0
    2217:4 2: 
    x = 1
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: 
    x = 0
    2217:4 2: 
    x = 1
    2217:4 3: 
    x = 2
    2205:0 Starting level 4: 4 states generated, 3 distinct states found.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 6.5E-19
      based on the actual fingerprints:  val = 2.9E-19
    2206:0 Progress(-1) at <date>: 7 states generated, 3 distinct states found, -1 states left on queue.
    2204:0 7 states generated, 3 distinct states found.
---*)

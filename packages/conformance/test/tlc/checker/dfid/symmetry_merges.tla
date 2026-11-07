(*---
description: A SYMMETRY merges states under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: success
config: |
  INIT Init
  NEXT Next
  CONSTANTS A = A
  B = B
  SYMMETRY Perms
args:
  - -dfid
  - "10"
---*)
---- MODULE symmetry_merges ----
EXTENDS Naturals, TLC
VARIABLE x
CONSTANTS A, B
Init == x \in {A, B}
Next == x' = x
Perms == Permutations({A, B})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 2 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 2 states generated, 1 distinct states found.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
      based on the actual fingerprints:  val = 1.1E-19
    2206:0 Progress(-1) at <date>: 3 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 3 states generated, 1 distinct states found.
---*)

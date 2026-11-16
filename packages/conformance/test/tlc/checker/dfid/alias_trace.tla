(*---
description: An ALIAS applies to a -dfid trace.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
args:
  - -dfid
  - "10"
---*)
---- MODULE alias_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [double |-> 2 * x]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: 
    x = 0
    2217:4 2: 
    x = 1
    2217:4 3: 
    x = 2
    2206:0 Progress(-1) at <date>: 4 states generated, 3 distinct states found, -1 states left on queue.
    2204:0 4 states generated, 3 distinct states found.
---*)

(*---
description: An evaluation error in an invariant reports the invariant failure under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -dfid
  - "10"
---*)
---- MODULE invariant_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == 1 \div (1 - x) >= 0
====

(*--- recorded
all:
  exit: 76
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2111:1 Evaluating invariant Inv failed.
    2121:1 The behavior up to this point is:
    2216:4 1:
    x = 0
    2216:4 2:
    x = 1
    2206:0 Progress(-1) at <date>: 3 states generated, 2 distinct states found, -1 states left on queue.
    2204:0 3 states generated, 2 distinct states found.
---*)

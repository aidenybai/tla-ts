(*---
description: An invariant violated by an initial state prints the state and stops -dfid.
ref: tlc2/tool/DFIDModelChecker.java#doInit
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -dfid
  - "10"
---*)
---- MODULE invariant_initial ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x = 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    x = 0
---*)

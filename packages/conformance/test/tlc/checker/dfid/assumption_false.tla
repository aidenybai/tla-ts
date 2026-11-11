(*---
description: A false ASSUME stops -dfid before computing initial states.
ref: tlc2/tool/DFIDModelChecker.java#checkAssumptions
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE assumption_false ----
EXTENDS Naturals, TLC
VARIABLE x
ASSUME FALSE
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 15, col 8 to line 15, col 12 of module assumption_false is false.
---*)

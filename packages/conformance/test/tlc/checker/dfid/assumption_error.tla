(*---
description: An evaluation error in an ASSUME reports the assumption error under -dfid.
ref: tlc2/tool/DFIDModelChecker.java#checkAssumptions
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE assumption_error ----
EXTENDS Naturals, TLC
VARIABLE x
ASSUME 1 \div 0 = 1
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 19 of module assumption_error failed.
    2179:0 The second argument of \div is 0.
---*)

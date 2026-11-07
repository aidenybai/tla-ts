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
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)

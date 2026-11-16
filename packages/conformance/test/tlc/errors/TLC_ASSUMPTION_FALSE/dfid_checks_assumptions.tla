(*---
description: Depth-first checking runs the assumptions too.
ref: tlc2/tool/DFIDModelChecker.java#modelCheck
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "2"
---*)
---- MODULE dfid_checks_assumptions ----
VARIABLE x
Init == x = 0
Next == x' = x
ASSUME FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 16, col 8 to line 16, col 12 of module dfid_checks_assumptions is false.
---*)

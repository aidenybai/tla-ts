(*---
description: Assumptions are checked before the initial states, so an Init that would fail doesn't get reached.
ref: tlc2/tool/AbstractChecker.java#checkAssumptions
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE before_init_is_evaluated ----
EXTENDS Naturals
ASSUME FALSE
VARIABLE x
Init == x = 1 + "a"
Next == x' = x
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 11, col 8 to line 11, col 12 of module before_init_is_evaluated is false.
---*)

(*---
description: A true assumption before the false one prints nothing.
ref: tlc2/tool/AbstractChecker.java#checkAssumptions
outcome: assumption-violation
config: ""
---*)
---- MODULE after_a_true_assumption ----
ASSUME TRUE
ASSUME FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 9, col 8 to line 9, col 12 of module after_a_true_assumption is false.
---*)

(*---
description: A named ASSUME reports the same way, located at its body.
ref: tlc2/tool/AbstractChecker.java#checkAssumptions
outcome: assumption-violation
config: ""
---*)
---- MODULE named_assumption ----
ASSUME Named == FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 17 to line 8, col 21 of module named_assumption is false.
---*)

(*---
description: A false named ASSUMPTION stops TLC.
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: assumption-violation
---*)
---- MODULE named_assumption_false ----
ASSUMPTION A == FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 17 to line 8, col 21 of module named_assumption_false is false.
---*)

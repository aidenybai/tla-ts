(*---
description: A false named ASSUME stops TLC.
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: assumption-violation
---*)
---- MODULE named_assume_false ----
ASSUME A == FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 13 to line 8, col 17 of module named_assume_false is false.
---*)

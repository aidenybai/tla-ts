(*---
description: ASSUMPTION is ASSUME.
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: assumption-violation
---*)
---- MODULE assumption_keyword_false ----
ASSUMPTION FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 12 to line 8, col 16 of module assumption_keyword_false is false.
---*)

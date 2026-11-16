(*---
description: "Unlike a theorem, an assumption is checked even when named."
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [proofs]
outcome: assumption-violation
---*)
---- MODULE false_named_assumption_checked ----
ASSUME A == 1 = 2
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 13 to line 8, col 17 of module false_named_assumption_checked is false.
---*)

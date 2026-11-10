(*---
description: "The first false ASSUME is reported, and others after it are not evaluated."
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: assumption-violation
---*)
---- MODULE first_false_reported ----
EXTENDS TLC
ASSUME FALSE
ASSUME PrintT("not reached")
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 9, col 8 to line 9, col 12 of module first_false_reported is false.
---*)

(*---
description: ASSUMEs before a false one run in order.
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: assumption-violation
---*)
---- MODULE true_before_false_runs ----
EXTENDS TLC
ASSUME PrintT("first")
ASSUME FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    | "first"
    2104:1 Assumption line 10, col 8 to line 10, col 12 of module true_before_false_runs is false.
---*)

(*---
description: A false ASSUME stops TLC before any state.
ref: "tlc2/tool/ModelChecker.java#checkAssumptions"
features: [assume_theorem]
outcome: assumption-violation
---*)
---- MODULE assume_false_stops ----
ASSUME FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 8 to line 8, col 12 of module assume_false_stops is false.
---*)

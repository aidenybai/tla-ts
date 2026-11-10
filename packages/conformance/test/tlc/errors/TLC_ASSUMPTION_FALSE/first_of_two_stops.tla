(*---
description: Checking stops at the first false assumption, so the second isn't reported.
ref: tlc2/tool/AbstractChecker.java#checkAssumptions
outcome: assumption-violation
config: ""
---*)
---- MODULE first_of_two_stops ----
ASSUME FALSE /\ TRUE
ASSUME TRUE /\ FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 8 to line 8, col 20 of module first_of_two_stops is false.
---*)

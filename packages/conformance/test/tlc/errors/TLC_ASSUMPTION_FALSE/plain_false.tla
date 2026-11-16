(*---
description: A false ASSUME reports TLC_ASSUMPTION_FALSE and exits 10.
ref: tlc2/tool/AbstractChecker.java#checkAssumptions
outcome: assumption-violation
config: ""
---*)
---- MODULE plain_false ----
ASSUME FALSE
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 8, col 8 to line 8, col 12 of module plain_false is false.
---*)

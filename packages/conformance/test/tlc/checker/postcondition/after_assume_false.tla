(*---
description: A POSTCONDITION is not evaluated after a false ASSUME.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE after_assume_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
ASSUME FALSE
Post == PrintT(<<"post", TLCGet("level")>>)
====

(*--- recorded
all:
  exit: 10
  transcript: 2104:1 Assumption line 15, col 8 to line 15, col 12 of module after_assume_false is false.
---*)

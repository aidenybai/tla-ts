(*---
description: Evaluates a random record expression, seed 262, number 525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b884 == (3 + 0) IN (<<5, 6>>)[b884], b |-> (([a |-> 1, b |-> TRUE]).a < (3 * 0))] EXCEPT !.a = (((0 = 7) - Len(<<3, 1, 2>>)) \div ((-1 :> 2147483647))[(1 * 1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00525 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)

(*---
description: Evaluates a random record expression, seed 262, number 4509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> {1}] : TRUE) EXCEPT !.a = @ + LET b7085 == (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) - (2 + 7)) IN Cardinality({b7085, -1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04509 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)

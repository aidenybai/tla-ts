(*---
description: Evaluates a random int expression, seed 262, number 7540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b11621 == Len(SelectSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0)) IN (CHOOSE b11622 \in DOMAIN [b11623 \in {x \in 1..3 : x > 1} |-> b11623] : ([b11624 \in {} |-> b11621] <=> ({x \in 1..3 : x > 1} = {}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07540 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 183 to line 14, col 240 of module random_07540
---*)

(*---
description: Evaluates a random int expression, seed 262, number 6585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 \div 2) + ([x \in 1..2 |-> x])[-1]) + Head([<<1>> EXCEPT ![1] = 2])) \div Len(SelectSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06585 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

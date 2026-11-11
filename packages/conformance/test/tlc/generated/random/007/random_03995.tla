(*---
description: Evaluates a random seq expression, seed 262, number 3995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<(CASE TRUE -> 1 [] OTHER -> FALSE - Head(<<3, 1, 2>>)), (([a |-> 1]).a % ([x \in Nat |-> x + 1])[-1])>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03995 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 115 to line 14, col 119 of module random_03995>],
    the first argument is:
    -1
    which is not in its domain.
---*)

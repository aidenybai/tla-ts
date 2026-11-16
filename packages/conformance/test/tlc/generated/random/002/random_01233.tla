(*---
description: Evaluates a random function expression, seed 262, number 1233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail(Append(<<1, 2>>, -1)), LAMBDA e : e > 0) EXCEPT ![(Len(Append(<<3, 1, 2>>, 2)) % ((CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE))[(0)[2147483647]])] = ([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + Head(<<1, 2>>)] \div Cardinality((Nat \ {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01233 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 163 to line 14, col 177 of module random_01233
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 1717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b2733 \in ((Nat \ 1..3) \cap {7, 2147483647}) : (<<b2733, Nat>> = [b2734 \in Nat |-> 1])) <=> ((-(<<>> \div [a |-> 1])) = LET b2735 == SortSeq(<<>>, LAMBDA p, q : p < q) IN (b2735 * b2735))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01717 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)

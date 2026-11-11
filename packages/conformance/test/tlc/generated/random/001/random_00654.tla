(*---
description: Evaluates a random record expression, seed 262, number 654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(<<([x \in Nat |-> x + 1])[7], LET b1091 == 1 IN b1091>>, Cardinality({b1092 : b1092 \in 2..1})) EXCEPT !.a = @ + (-SortSeq(SubSeq(<<1>>, 0, 0), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00654 failed.
    Attempted to access tuple at a non integral index: "a"
---*)

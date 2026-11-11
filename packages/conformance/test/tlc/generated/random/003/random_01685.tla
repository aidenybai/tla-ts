(*---
description: Evaluates a random set expression, seed 262, number 1685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), Head(<<>>)), LAMBDA p, q : p < q), Cardinality(((7 * 1) .. Head(<<1>>))), CASE (([x \in Nat |-> x + 1] @@ <<5, 6>>) .. (3 * 3)) -> Cardinality(UNION {{2, 1, 3}, {1, 2}}) [] OTHER -> (LET b2689 == 7 IN 2147483647 - {0 : b2690 \in {1}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01685 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

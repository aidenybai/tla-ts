(*---
description: Evaluates a random record expression, seed 262, number 1718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), Head(<<1, 2>>), Head(<<3, 1, 2>>))), b |-> (((3 < 2147483647) => (Nat \subseteq {1, 2})) /\ (\A b2736 \in (2147483647 .. 7) : (~TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01718 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 143 to line 14, col 162 of module random_01718
---*)

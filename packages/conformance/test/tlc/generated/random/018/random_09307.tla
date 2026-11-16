(*---
description: Evaluates a random bool expression, seed 262, number 9307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SelectSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), LAMBDA p, q : p < q) = ([b14443 \in (0 .. 2) |-> Cardinality({1})] @@ CASE (2147483647 < 2147483647) -> (CHOOSE b14444 \in {1, 2} : FALSE) [] OTHER -> Head(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09307 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

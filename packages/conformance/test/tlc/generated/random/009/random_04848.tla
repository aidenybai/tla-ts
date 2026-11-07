(*---
description: Evaluates a random seq expression, seed 262, number 4848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(SortSeq(Append(<<1, 2>>, 0), LAMBDA p, q : p < q), CASE (1..3 \subseteq {}) -> Cardinality({x \in 1..3 : x > 1}) [] OTHER -> (-1 % 7), Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

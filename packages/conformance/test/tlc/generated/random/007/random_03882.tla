(*---
description: Evaluates a random seq expression, seed 262, number 3882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA e : e > 0), IF ((TRUE <=> FALSE) => (\A b6115 \in {1} : FALSE)) THEN Head(<<2147483647, 7>>) ELSE ((2 - 3) % (-7))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647>>"
---*)

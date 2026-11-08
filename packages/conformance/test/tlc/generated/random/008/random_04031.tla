(*---
description: Evaluates a random function expression, seed 262, number 4031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6335 \in ((LET b6336 == 7 IN b6336 .. Cardinality(2..1)) \cup {LET b6337 == 7 IN 3, (1 % -1)}) |-> (Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) + Len(SortSeq(<<1>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04031 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

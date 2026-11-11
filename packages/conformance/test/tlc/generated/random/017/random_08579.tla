(*---
description: Evaluates a random int expression, seed 262, number 8579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({b13292 : b13292 \in 1..3}) % (-Cardinality({x \in 1..3 : x > 1}))) * (Head(SubSeq(<<1, 2>>, 3, 2147483647)) + ((-2147483647) \div Cardinality(Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08579 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
---*)

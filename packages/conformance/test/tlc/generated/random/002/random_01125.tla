(*---
description: Evaluates a random set expression, seed 262, number 1125.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01125 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({SortSeq(DOMAIN [(1 :> 2) EXCEPT ![2147483647] = 7], LAMBDA p, q : p < q), ((([a |-> 1]).a + ([a |-> 1, b |-> TRUE]).a) \div LET b1801 == IF FALSE THEN 7 ELSE 7 IN Head(<<1>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 34 to line 14, col 39 of module random_01125
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1}
---*)

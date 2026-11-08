(*---
description: Evaluates a random function expression, seed 262, number 1788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-[(-1 :> <<>>) EXCEPT ![Head(<<1>>)] = LET b2830 == 3 IN 0]) @@ UNION {{(2147483647 - 2147483647), Cardinality(Nat)}, DOMAIN (7 :> 1)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 30 of module random_01788
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01788 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

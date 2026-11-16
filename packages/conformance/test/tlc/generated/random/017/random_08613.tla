(*---
description: Evaluates a random bool expression, seed 262, number 8613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b13340 \in (0 .. 1) : (TRUE \/ TRUE)) \div ([[x \in Nat |-> x + 1] EXCEPT ![1] = 1] + Cardinality(2..1))) < Head(<<LET b13341 == 2147483647 IN 0, SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08613 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)

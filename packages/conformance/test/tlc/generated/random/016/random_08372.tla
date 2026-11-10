(*---
description: Evaluates a random bool expression, seed 262, number 8372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 :> 2147483647) \cup UNION {{x \in 1..3 : x > 1}, 2..1}) \ ((-1) .. (2147483647 + <<5, 6>>))) \subseteq {b12951 \in ((7 .. 2147483647) \cup (2147483647 .. 0)) : (SortSeq(<<1, 2>>, LAMBDA p, q : p < q) = (CHOOSE f \in [{} -> {1, 2}] : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08372 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

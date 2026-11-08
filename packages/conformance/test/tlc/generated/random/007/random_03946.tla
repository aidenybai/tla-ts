(*---
description: Evaluates a random bool expression, seed 262, number 3946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SelectSeq(<<>>, LAMBDA e : e > 0) - Cardinality({x \in 1..3 : x > 1})) < LET b6207 == LET b6208 == 0 IN Nat IN CASE FALSE -> 0 [] OTHER -> 2147483647) <=> (Cardinality(UNION {1..3, <<1>>}) < LET b6209 == Cardinality({x \in 1..3 : x > 1}) IN (2 \in {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03946 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

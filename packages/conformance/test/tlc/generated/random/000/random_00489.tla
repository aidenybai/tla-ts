(*---
description: Evaluates a random bool expression, seed 262, number 489.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00489 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE [a |-> 1, b |-> TRUE] -> b800 [] OTHER -> b800 : b800 \in (7 .. TRUE)} = {(0 * 3), (-0)}) => ((Head(<<1, 2>>) * Cardinality({2, 1, 3})) = (([x \in Nat |-> x + 1])[2] * LET b801 == 1 IN 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

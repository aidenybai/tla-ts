(*---
description: Evaluates a random int expression, seed 262, number 4974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(IF (1 = 2147483647) THEN (1 + 1) ELSE ({x \in 1..3 : x > 1} \cup 2..1) - ((2 - 2147483647) \div IF FALSE THEN 1 ELSE 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04974 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)

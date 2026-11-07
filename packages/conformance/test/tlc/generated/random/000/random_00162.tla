(*---
description: Evaluates a random function expression, seed 262, number 162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (IF FALSE THEN 2 ELSE 0 \in {3, 3}) -> IF (\E b252 \in {2, 1, 3} : TRUE) THEN (7 + 1) ELSE Head(<<3, 1, 2>>) [] OTHER -> (-LET b253 == 2 IN 2147483647) :> ((LET b254 == SUBSET {1} IN b254 \div (-2147483647)) - (Head((1 :> 2)) - (-1 + 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
---*)

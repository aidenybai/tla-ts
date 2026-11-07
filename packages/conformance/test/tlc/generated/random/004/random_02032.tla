(*---
description: Evaluates a random record expression, seed 262, number 2032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2, b |-> TRUE] EXCEPT !.a = @ + IF FALSE THEN 1 ELSE TRUE] EXCEPT !.a = @ + ((2147483647 \div 2) + LET b3226 == 2147483647 IN 2)] EXCEPT !.a = Cardinality({b3227 \in {b3228 \in {2, 1, 3} : FALSE} : ([x \in Nat |-> x + 1] = 2147483647)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

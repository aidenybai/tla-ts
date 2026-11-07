(*---
description: Evaluates a random function expression, seed 262, number 6307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((\E b9697 \in 1..3 : FALSE) - (3 * 3))) :> ((IF TRUE THEN 3 ELSE 3 % LET b9698 == 3 IN b9698) \div (CHOOSE b9699 \in {2147483647 : b9700 \in {1, 2}} : (<<1, 2>> \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

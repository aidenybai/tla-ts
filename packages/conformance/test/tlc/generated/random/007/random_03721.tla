(*---
description: Evaluates a random function expression, seed 262, number 3721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 2147483647, b |-> <<1>>] EXCEPT !.a = (2147483647 \div 1)]).a :> IF (([a |-> 1, b |-> TRUE]).a = (7 \div 2147483647)) THEN ((7 - -1) % (1 - 2147483647)) ELSE (-CASE FALSE -> 3 [] OTHER -> {2, 1, 3})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)

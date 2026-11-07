(*---
description: Evaluates a random function expression, seed 262, number 5660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b8733 \in ({b8734 \in {x \in 1..3 : x > 1} : FALSE} .. Cardinality(1..3)) |-> LET b8735 == (0 \div 2) IN IF TRUE THEN 1 ELSE 3] @@ (([b8736 \in {x \in 1..3 : x > 1} |-> 2] @@ [[a |-> 1] EXCEPT !.a = @ + 2]) @@ [[b8737 \in {1} |-> b8737] EXCEPT ![(0 * 7)] = (0 % 2147483647)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)

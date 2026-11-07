(*---
description: Evaluates a random record expression, seed 262, number 5781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> -1, b |-> FALSE] EXCEPT !.a = Head(<<1>>)] EXCEPT !.a = @ + (-IF FALSE THEN 2147483647 ELSE -1)] EXCEPT !.a = @ + IF ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + {1, 2}] \/ (7 = 7)) THEN ((-1 * 2147483647) - LET b8909 == 2 IN b8909) ELSE Cardinality((1..3 \cap 2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)

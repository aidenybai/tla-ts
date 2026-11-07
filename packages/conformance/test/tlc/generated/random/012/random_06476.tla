(*---
description: Evaluates a random set expression, seed 262, number 6476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} \cup <<>>) \cup DOMAIN [x \in 1..2 |-> x]) \cap DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![1] = -1]) \cap UNION {((1..3 \cup [x \in Nat |-> x + 1]) \ {7, 2147483647}), {({1, 2} + 2), CASE FALSE -> 7 [] OTHER -> [a |-> 1]}}))
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

(*---
description: Evaluates a random int expression, seed 262, number 4850.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04850 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b7564 \in {b7565 \in (2147483647 = 1) : [a |-> 2, b |-> TRUE]} |-> Cardinality(({1, 2} \cap SUBSET {1}))])[(CASE (2147483647 < 2147483647) -> IF FALSE THEN 7 ELSE 2..1 [] OTHER -> (-FALSE) * Cardinality((Nat \cap SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

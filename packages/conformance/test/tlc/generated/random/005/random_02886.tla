(*---
description: Evaluates a random bool expression, seed 262, number 2886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} - 0) * [[a |-> 1] EXCEPT !.a = @ + 7]) - (IF TRUE THEN 7 ELSE 0 + (-2))) = IF (\E b4572 \in DOMAIN <<5, 6>> : ((1 :> 2) <=> TRUE)) THEN (CHOOSE b4573 \in (Nat \cap SUBSET {1}) : (b4573 /\ TRUE)) ELSE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)

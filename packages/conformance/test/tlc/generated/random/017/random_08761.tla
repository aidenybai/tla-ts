(*---
description: Evaluates a random bool expression, seed 262, number 8761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<({b13562 \in SUBSET {1} : FALSE} * IF FALSE THEN 0 ELSE 1), (LET b13563 == 3 IN 3 \div (CHOOSE b13564 \in Nat : TRUE))>> = [b13565 \in {b13566 \in [b13567 \in {} |-> 0] : (~FALSE)} |-> ([<<5, 6>> EXCEPT ![b13565] = b13565])[(7 - {1, 2})]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetPredValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetPredValue to tlc2.value.impl.IntValue
---*)

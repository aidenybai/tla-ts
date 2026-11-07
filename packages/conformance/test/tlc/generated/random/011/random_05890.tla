(*---
description: Evaluates a random set expression, seed 262, number 5890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (({b9089 \in SUBSET {1} : TRUE} \cap (2..1 \ 1..3)) + (IF FALSE THEN -1 ELSE 1 % ([x \in Nat |-> x + 1])[0])), b |-> (SubSeq([<<>> EXCEPT ![1] = 7], (3 * 1), (<<1, 2>>).a) = [(2147483647 :> 3) EXCEPT ![([a |-> 1, b |-> TRUE]).a] = (2147483647 * 0)])])
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

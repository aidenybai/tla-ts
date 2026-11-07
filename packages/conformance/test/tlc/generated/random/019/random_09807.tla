(*---
description: Evaluates a random set expression, seed 262, number 9807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len([<<3, 1, 2>> EXCEPT ![1] = b15217]) : b15217 \in {(7 \div {1}), (-1 % 2147483647)}} \ {CASE (FALSE /\ FALSE) -> (3 + 3) [] OTHER -> LET b15218 == 2147483647 IN [a |-> 1], (({2, 1, 3} + 3) \div LET b15219 == 7 IN 1)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)

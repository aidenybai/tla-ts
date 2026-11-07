(*---
description: Evaluates a random set expression, seed 262, number 1067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((2 - 2) * [b1709 \in {2, 1, 3} |-> 1]), Len((<<1, 2>> \o <<>>))} \ ((LET b1710 == FALSE IN 7 - Len(<<>>)) .. CASE (FALSE /\ FALSE) -> (<<5, 6>>)[2147483647] [] OTHER -> Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

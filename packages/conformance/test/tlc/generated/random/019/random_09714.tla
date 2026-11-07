(*---
description: Evaluates a random set expression, seed 262, number 9714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len((<<>> \o <<>>)) - ((Nat * 2147483647) - Head(<<1>>))), Len(<<Head(<<3, 1, 2>>), (<<5, 6>>)[0]>>)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
---*)

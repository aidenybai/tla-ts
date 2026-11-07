(*---
description: Evaluates a random bool expression, seed 262, number 3236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (FALSE - 2147483647), b |-> ({2, 1, 3} = {1})]).a \in {(Cardinality(<<3, 1, 2>>) - Len(<<>>)) : b5141 \in ((0 - 1) .. (<<5, 6>>)[2])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

(*---
description: Evaluates a random function expression, seed 262, number 2931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b4638 \in {2, 1, 3} |-> 1])[(<<1, 2>> * 2)] % (([a |-> 1, b |-> TRUE]).a - Cardinality({1}))) :> ([a |-> (0 * 0), b |-> (2 = -1)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

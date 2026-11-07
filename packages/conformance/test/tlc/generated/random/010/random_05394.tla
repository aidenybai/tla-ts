(*---
description: Evaluates a random function expression, seed 262, number 5394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b8344 \in {(7 % 2) : b8345 \in UNION {2..1, {2, 1, 3}}} |-> ((3 % 2..1) - (-7))] EXCEPT ![LET b8346 == (Cardinality({1, 2}) + Cardinality(SUBSET {1})) IN Len((<<1>> \o <<3, 1, 2>>))] = (-(CHOOSE b8347 \in {2, 2147483647} : ([a |-> 1] = [a |-> 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)

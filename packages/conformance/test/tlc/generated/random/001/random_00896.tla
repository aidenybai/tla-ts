(*---
description: Evaluates a random function expression, seed 262, number 896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1446 \in (UNION {IF FALSE THEN 2147483647 ELSE 3, (Nat \cup 2..1)} \cup (IF FALSE THEN 3 ELSE 1 .. <<3, -1>>)) |-> (Cardinality(UNION {1..3, Nat}) % Cardinality((Nat \cap Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

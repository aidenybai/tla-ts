(*---
description: Evaluates a random seq expression, seed 262, number 8629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), LAMBDA e : e > 0) EXCEPT ![1] = (Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), Cardinality({1})) - IF (TRUE /\ TRUE) THEN CASE FALSE -> {1} [] OTHER -> FALSE ELSE ([a |-> 1, b |-> TRUE]).a)])
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

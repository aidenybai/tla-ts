(*---
description: Evaluates a random set expression, seed 262, number 2548.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02548 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len([Tail(<<1>>) EXCEPT ![1] = (CHOOSE b4020 \in {1} : FALSE)]), ((-LET b4021 == -1 IN b4021) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + <<1>>]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 32 of module random_02548
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

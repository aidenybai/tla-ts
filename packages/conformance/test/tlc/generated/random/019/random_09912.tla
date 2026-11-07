(*---
description: Evaluates a random function expression, seed 262, number 9912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE b15414 \in (2 .. <<1>>) : (-1 < TRUE)) :> ((-1 + 7) + (-1 * 2147483647))) EXCEPT ![Cardinality({(-1 % 2147483647), Head(<<>>)})] = Head([Tail(<<>>) EXCEPT ![1] = (0 * 1)])])
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

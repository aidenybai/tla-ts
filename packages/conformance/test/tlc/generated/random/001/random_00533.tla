(*---
description: Evaluates a random function expression, seed 262, number 533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((-(0 * 3)) :> Len(Append(<<1, 2>>, 3))) EXCEPT ![(SortSeq(<<-1, -1>>, LAMBDA p, q : p < q) * Len(<<TRUE, 3>>))] = Cardinality(((0 + 2) - (7 \div 1)))])
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

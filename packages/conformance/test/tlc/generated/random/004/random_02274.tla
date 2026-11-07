(*---
description: Evaluates a random bool expression, seed 262, number 2274.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02274 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \div (Len(<<>>) * (-7))) \in [b3590 \in Append(SortSeq(<<1>>, LAMBDA p, q : p < q), (3 \div 2)) |-> ((-b3590) * (7 % 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

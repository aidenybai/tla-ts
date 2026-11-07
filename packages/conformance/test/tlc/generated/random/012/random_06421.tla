(*---
description: Evaluates a random seq expression, seed 262, number 6421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<1>>)] \o Append([<<>> EXCEPT ![1] = -1], [[a |-> 1] EXCEPT !.a = 3])) EXCEPT ![1] = (-([<<5, 6>> EXCEPT ![7] = 2147483647] * (CHOOSE b9886 \in {2, 1, 3} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 98 to line 14, col 101 of module random_06421
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 169 to line 14, col 176 of module random_06421
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

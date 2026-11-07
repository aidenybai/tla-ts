(*---
description: Evaluates a random seq expression, seed 262, number 2434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq((([a |-> 1] .. 2) \cap {b3844 \in {2, 1, 3} : FALSE}), LAMBDA p, q : p < q), (CHOOSE b3845 \in ((2147483647 .. 0) \cup SubSeq(<<3, 1, 2>>, 0, 2..1)) : ((b3845 % 3) \in {b3845 : b3846 \in {1}})), ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)

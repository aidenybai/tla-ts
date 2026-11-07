(*---
description: Evaluates a random int expression, seed 262, number 9645.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09645 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14977 \in (((<<1>> \o <<>>) .. (-1 + 0)) \cap {b14978 \in {2147483647 : b14979 \in {x \in 1..3 : x > 1}} : ({1, 2} \in {})}) : (((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)) /\ ((1 \in {1}) /\ [b14980 \in 2..1 |-> b14977]))))
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

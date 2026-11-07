(*---
description: Evaluates a random record expression, seed 262, number 2910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Cardinality({1}), b |-> (1 \in 2..1)] EXCEPT !.a = SortSeq((<<3, 1, 2>> \o <<3, 1, 2>>), LAMBDA p, q : p < q)] EXCEPT !.a = @ + [[a |-> [a |-> 7, b |-> TRUE], b |-> (FALSE /\ TRUE)] EXCEPT !.a = Cardinality({b4607 \in {x \in 1..3 : x > 1} : TRUE})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)

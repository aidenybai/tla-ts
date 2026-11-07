(*---
description: Evaluates a random record expression, seed 262, number 5387.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05387 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 7, b |-> FALSE] EXCEPT !.a = (3 \div 2)] EXCEPT !.a = (-[<<1>> EXCEPT ![1] = 1])] EXCEPT !.a = @ + ([b8330 \in {b8331 : b8331 \in {x \in 1..3 : x > 1}} |-> IF (1 :> 2) THEN 1 ELSE b8330])[(Head(<<3, 1, 2>>) + Head(<<>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

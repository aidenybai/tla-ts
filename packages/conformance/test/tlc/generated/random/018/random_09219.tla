(*---
description: Evaluates a random int expression, seed 262, number 9219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14310 \in (DOMAIN [x \in Nat |-> x + 1] \cap (1 .. <<3, 1, 2>>)) : (([a |-> 1, b |-> TRUE]).a < Len(<<3, 1, 2>>))) - CASE (((1 :> 2))[1] \in ({1, 2} \cup 2..1)) -> ((2147483647 + 1) - (2 \div 1)) [] OTHER -> (IF TRUE THEN 2147483647 ELSE 7 \div (<<5, 6>>)[0])))
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

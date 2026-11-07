(*---
description: Evaluates a random function expression, seed 262, number 9082.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09082 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14117 \in (((2147483647 .. 0) = (-[x \in 1..2 |-> x])) /\ (~(\E b14118 \in SUBSET {1} : FALSE))) |-> Len(Tail(Append(<<3, 1, 2>>, b14117)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

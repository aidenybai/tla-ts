(*---
description: Evaluates a random bool expression, seed 262, number 8971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-CASE TRUE -> Nat [] OTHER -> 0), ((<<5, 6>>)[2..1] + ([x \in 1..2 |-> x])[3])} = (LET b13919 == Len(<<>>) IN CASE <<5, 6>> -> b13919 [] OTHER -> 2147483647 .. LET b13920 == ([x \in Nat |-> x + 1])[-1] IN Len(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
---*)

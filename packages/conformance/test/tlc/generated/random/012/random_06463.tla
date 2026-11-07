(*---
description: Evaluates a random int expression, seed 262, number 6463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((TRUE \div 1) - (-1 - 2147483647)) + CASE (<<1>> = [x \in Nat |-> x + 1]) -> Head(<<1, 2>>) [] OTHER -> (-1 \div 1)) \in {(CHOOSE b9946 \in UNION {1..3, {1}} : (Nat = {1})) : b9945 \in {(CHOOSE b9948 \in TRUE : FALSE) : b9947 \in ({} \cap <<1>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

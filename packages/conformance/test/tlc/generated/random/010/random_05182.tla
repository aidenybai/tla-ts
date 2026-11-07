(*---
description: Evaluates a random function expression, seed 262, number 5182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<5, 6>>) - (0 \in {})) - ((CHOOSE r \in [a : 1..2] : TRUE)).a) :> (((FALSE <=> FALSE) + Len(<<3, 1, 2>>)) * LET b8042 == Len(<<3, 1, 2>>) IN (-1 - b8042))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

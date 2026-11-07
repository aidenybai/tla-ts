(*---
description: Evaluates a random function expression, seed 262, number 3251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5170 \in ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) \cup {Len(<<>>), (3 % (1 :> 2))}) |-> (((b5170 * b5170) + Head([a |-> 1])) * ((CHOOSE b5171 \in 1..3 : FALSE) + Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

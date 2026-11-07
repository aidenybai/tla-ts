(*---
description: Evaluates a random seq expression, seed 262, number 9151.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09151 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((<<3, 1, 2>> \o <<1>>) \o <<3, 3>>) EXCEPT ![1] = IF (<<3, 1, 2>> = <<5, 6>>) THEN ((1 :> 2))[2] ELSE ((1 :> 2) + 1)] EXCEPT ![1] = [a |-> LET b14214 == (7 + 0) IN (b14214 * 2147483647), b |-> ((1 % 2) = IF FALSE THEN 0 ELSE -1)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

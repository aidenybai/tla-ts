(*---
description: Evaluates a random function expression, seed 262, number 9684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] \div 2147483647) :> CASE TRUE -> 3 [] OTHER -> 7))[((\E b15022 \in 2..1 : FALSE)).a] :> Head(<<CASE TRUE -> 2147483647 [] OTHER -> 0, (-2147483647)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)

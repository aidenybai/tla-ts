(*---
description: Evaluates a random record expression, seed 262, number 3172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> ([x \in Nat |-> x + 1] + 3), b |-> [-1 EXCEPT !.a = @ + FALSE]] EXCEPT !.a = @ + ((-1 - 7) - Len(<<>>))] EXCEPT !.a = @ + IF (([a |-> 1] = [a |-> 1]) \/ (~FALSE)) THEN (-(1 * 2147483647)) ELSE [SelectSeq(FALSE, LAMBDA e : e > 0) EXCEPT ![1] = (2 - 2147483647)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)

(*---
description: Evaluates a random record expression, seed 262, number 683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = @ + (3 - [x \in Nat |-> x + 1])] EXCEPT !.a = ([[x \in 1..2 |-> x] EXCEPT ![7] = 3])[Head(<<1>>)]] EXCEPT !.a = (((CHOOSE b1142 \in 2..1 : TRUE) + Len(<<3, 1, 2>>)) * (IF FALSE THEN 3 ELSE 2 % IF TRUE THEN 0 ELSE 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00683 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)

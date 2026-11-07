(*---
description: Evaluates a random int expression, seed 262, number 9491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14744 \in {[[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = @ + LET b14745 == -1 IN <<1, 2>>], ([(1 :> 2) EXCEPT ![-1] = <<3, 1, 2>>])[Head(<<1, 2>>)]} : ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

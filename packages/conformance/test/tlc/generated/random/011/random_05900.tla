(*---
description: Evaluates a random bool expression, seed 262, number 5900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b9099 \in {(<<5, 6>> * 2147483647), CASE TRUE -> 2 [] OTHER -> 0} : ([[a |-> 1] EXCEPT !.a = b9099] = [a |-> b9099, b |-> TRUE])) <=> ([[[a |-> 1] EXCEPT !.a = 7] EXCEPT !.a = @ + LET b9100 == 1 IN 7] = [[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = ([a |-> 1, b |-> TRUE] + 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

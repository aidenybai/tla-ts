(*---
description: Evaluates a random function expression, seed 262, number 5187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len((<<3, 1, 2>> \o <<1>>)) * (CASE FALSE -> [a |-> 1] [] OTHER -> [x \in Nat |-> x + 1] - DOMAIN [x \in Nat |-> x + 1])) :> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] = [[a |-> 1] EXCEPT !.a = @ + 2147483647]) /\ (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = [[x \in 1..2 |-> x] EXCEPT ![7] = 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
---*)

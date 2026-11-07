(*---
description: Evaluates a random function expression, seed 262, number 3478.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03478 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Head(Tail(<<3, 1, 2>>))) :> ((IF FALSE THEN 1 ELSE 7 + UNION {{}, Nat}) + CASE (TRUE => FALSE) -> CASE FALSE -> 7 [] OTHER -> 2147483647 [] OTHER -> IF TRUE THEN 1 ELSE -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UnionValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UnionValue to tlc2.value.impl.IntValue
---*)

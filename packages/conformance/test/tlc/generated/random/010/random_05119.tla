(*---
description: Evaluates a random record expression, seed 262, number 5119.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05119 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> IF FALSE THEN 1 ELSE 2147483647, b |-> (\E b7959 \in {2, 1, 3} : TRUE)] EXCEPT !.a = @ + LET b7960 == (7 :> [x \in Nat |-> x + 1]) IN IF FALSE THEN b7960 ELSE b7960] EXCEPT !.a = (((-7) + Head(<<3, 1, 2>>)) % (CHOOSE b7961 \in ({1, 2} \ {1}) : (b7961 \in <<5, 6>>)))])
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

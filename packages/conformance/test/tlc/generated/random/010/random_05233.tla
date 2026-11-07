(*---
description: Evaluates a random set expression, seed 262, number 5233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-(1 :> 2)) * (CASE FALSE -> 3 [] OTHER -> <<>> * (<<5, 6>> @@ [x \in 1..2 |-> x]))), ([[a |-> 1, b |-> FALSE] EXCEPT !.a = (<<3, 1, 2>> \subseteq 2..1)]).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

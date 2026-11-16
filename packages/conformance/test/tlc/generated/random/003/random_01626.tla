(*---
description: Evaluates a random bool expression, seed 262, number 1626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<([a |-> 1]).a, Head(<<1>>)>> = ({1, 1} \cup ([x \in 1..2 |-> x] .. 2))) <=> (((Nat \cup {1, 2}) \cup DOMAIN [x \in Nat |-> x + 1]) = {CASE TRUE -> 1 [] OTHER -> 7, (CHOOSE b2597 \in -1 : FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01626 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

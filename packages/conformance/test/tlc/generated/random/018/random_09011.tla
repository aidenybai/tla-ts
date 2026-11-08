(*---
description: Evaluates a random set expression, seed 262, number 9011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 \div 3) + LET b13997 == 2 IN <<1, 2>>) % IF (FALSE /\ FALSE) THEN IF TRUE THEN -1 ELSE 2147483647 ELSE LET b13998 == 7 IN b13998) .. CASE ((<<3, 1, 2>> \o <<>>) = [b13999 \in {x \in 1..3 : x > 1} |-> b13999]) -> (Head(<<3, 1, 2>>) * Len({1})) [] OTHER -> ([[a |-> 1] EXCEPT !.a = @ + 0]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09011 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

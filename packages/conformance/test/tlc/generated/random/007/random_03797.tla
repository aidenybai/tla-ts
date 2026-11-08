(*---
description: Evaluates a random bool expression, seed 262, number 3797.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03797 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 3, b |-> FALSE] EXCEPT !.a = (0 + {x \in 1..3 : x > 1})] EXCEPT !.a = @ + (([a |-> 1]).a + CASE TRUE -> 7 [] OTHER -> 3)] = [a |-> LET b5989 == LET b5990 == 3 IN b5990 IN ([x \in 1..2 |-> x])[{x \in 1..3 : x > 1}], b |-> (~(TRUE /\ TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03797 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 3586.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03586 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + LET b5654 == 1 IN FALSE] EXCEPT !.a = @ + (Cardinality(Nat) - (TRUE - 0))] EXCEPT !.a = @ + CASE ((2 * 1) < (0 - 2147483647)) -> (IF FALSE THEN 1 ELSE 2 * Head(<<3, 1, 2>>)) [] OTHER -> ([a |-> 1, b |-> FALSE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03586 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

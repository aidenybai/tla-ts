(*---
description: Evaluates a random bool expression, seed 262, number 2302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b3635 \in [[[a |-> 3, b |-> TRUE] EXCEPT !.a = (-1 * [x \in 1..2 |-> x])] EXCEPT !.a = ([a |-> 2147483647, b |-> TRUE]).a] : (\A b3636 \in ((2 * 2) .. Len(<<1, 2>>)) : (([a |-> 1]).a \in {b3637 \in {2, 1, 3} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02302 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 8603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b13325 \in {([[a |-> 1] EXCEPT !.a = @ + b13326] = [[a |-> 1] EXCEPT !.a = @ + 0]) : b13326 \in {(3 - 0) : b13327 \in (2..1 \cup SUBSET {1})}} : ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = [[a |-> 2..1, b |-> TRUE] EXCEPT !.a = @ + (2147483647 - 2147483647)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08603 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)

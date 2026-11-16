(*---
description: Evaluates a random bool expression, seed 262, number 7887.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07887 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12176 \in (((0 * 2) \ (2 .. FALSE)) \cap ({2, 7} \cap [[a |-> 1] EXCEPT !.a = -1])) : ((Tail(<<3, 1, 2>>) = (CHOOSE b12177 \in SUBSET {1} : FALSE)) \/ ((2147483647 - b12176) \in (Nat \cap 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07887 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

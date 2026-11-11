(*---
description: Evaluates a random bool expression, seed 262, number 2576.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02576 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b4054 \in (((<<5, 6>> .. -1) \ (Nat \ {1, 2})) \cup ((2..1 \cap 1..3) \cap (0 .. 2147483647))) : ([[[a |-> 1] EXCEPT !.a = b4054] EXCEPT !.a = LET b4055 == b4054 IN b4054] = [a |-> (-1), b |-> (b4054 /\ TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02576 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)

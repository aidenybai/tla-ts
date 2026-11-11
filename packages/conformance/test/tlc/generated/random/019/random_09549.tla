(*---
description: Evaluates a random bool expression, seed 262, number 9549.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09549 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b14831 \in (([a |-> 1, b |-> TRUE]).a .. (FALSE => TRUE)) : (Tail(<<3, 1, 2>>) = (b14831 :> b14831))) /\ (Head(Tail(<<>>)) \in {Len(<<1, 2>>) : b14832 \in (2..1 \cap {1, 2})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09549 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

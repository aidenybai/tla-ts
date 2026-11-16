(*---
description: Evaluates a random set expression, seed 262, number 9237.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09237 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b14335 \in (({1} \cup 1..3) \cup (TRUE .. 3)) : (Len(<<1>>) \in ({2, 1, 3} \cap {2, 1, 3}))} \cap ({b14336 \in (-1 .. 2) : ((1 :> 2) /\ FALSE)} \cup DOMAIN [(1 :> 2) EXCEPT ![3] = 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09237 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)

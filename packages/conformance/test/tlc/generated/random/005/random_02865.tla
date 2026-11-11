(*---
description: Evaluates a random bool expression, seed 262, number 2865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b4536 \in (({b4537 : b4537 \in 1..3} \ (2147483647 .. 0)) \cap ((2..1 \cup Nat) .. ([a |-> 1, b |-> TRUE] + 0))) : (((TRUE /\ TRUE) => (~FALSE)) /\ ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b4536] = [[x \in 1..2 |-> x] EXCEPT ![1] = 2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02865 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)

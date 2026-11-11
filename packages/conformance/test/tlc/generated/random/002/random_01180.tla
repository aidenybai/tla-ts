(*---
description: Evaluates a random bool expression, seed 262, number 1180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b1893 \in {((-1 .. 3) * [[x \in 1..2 |-> x] EXCEPT ![1] = 3]), ((1 - 3) % (2 + 7))} : (((b1893 * <<1, 2>>) < ([x \in 1..2 |-> x])[b1893]) <=> ((2 .. b1893) /\ (TRUE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01180 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

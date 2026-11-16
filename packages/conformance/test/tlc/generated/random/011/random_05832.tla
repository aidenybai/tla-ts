(*---
description: Evaluates a random bool expression, seed 262, number 5832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {DOMAIN [x \in Nat |-> x + 1], (3 .. (1 :> 2))} \subseteq DOMAIN (CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE)) /\ ([a |-> (1 + 3), b |-> (~FALSE)] = [a |-> Len(<<1, 2>>), b |-> (TRUE \/ TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05832 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

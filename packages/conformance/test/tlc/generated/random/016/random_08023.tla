(*---
description: Evaluates a random bool expression, seed 262, number 8023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b12372 \in {b12373 \in (2 .. 2147483647) : (1..3 \subseteq {1, 2})} : (({1, 2} <=> FALSE) /\ (\A b12374 \in 2..1 : FALSE))) <=> ((CHOOSE f \in [{} -> {0} \cup {1}] : TRUE) \in CASE (TRUE <=> TRUE) -> (-1 * (1 :> 2)) [] OTHER -> (<<5, 6>>)[1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08023 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 2308.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02308 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(LET b3648 == 3 IN b3648 .. ([a |-> 1] + 0)), {b3649 \in ({1} \ FALSE) : (~TRUE)}} \subseteq DOMAIN [b3650 \in (<<3, 1, 2>> \cap 1..3) |-> (CHOOSE b3651 \in {2, 1, 3} : FALSE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02308 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)

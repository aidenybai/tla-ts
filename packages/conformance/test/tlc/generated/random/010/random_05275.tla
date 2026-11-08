(*---
description: Evaluates a random function expression, seed 262, number 5275.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05275 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {DOMAIN <<5, 6>>, UNION {SUBSET {1}, {}}}) :> CASE (UNION {<<>>, {1, 2}} \subseteq ({x \in 1..3 : x > 1} \ [a |-> 1, b |-> TRUE])) -> Cardinality((2147483647 .. 0)) [] OTHER -> (Len(<<1>>) + (CHOOSE b8164 \in [x \in Nat |-> x + 1] : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05275 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    1
---*)

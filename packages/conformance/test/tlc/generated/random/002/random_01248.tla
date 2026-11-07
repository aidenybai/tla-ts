(*---
description: Evaluates a random bool expression, seed 262, number 1248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((UNION {{x \in 1..3 : x > 1}, SUBSET {1}} \ (7 .. 7))) = (-IF (TRUE /\ TRUE) THEN Head(<<1, 2>>) ELSE CASE FALSE -> 0 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    2
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    2
---*)

(*---
description: Evaluates a random int expression, seed 262, number 7328.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07328 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({1}) + Head(<<1, 2>>)) \div (LET b11278 == 2147483647 IN b11278 - Cardinality({x \in 1..3 : x > 1}))) % Head((UNION {SUBSET {1}, {1}} \ {2147483647 : b11279 \in {2, 1, 3}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Head(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Head(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    1
---*)

(*---
description: Evaluates a random int expression, seed 262, number 5434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((({} \ {}) \cup UNION {<<3, 1, 2>>, Nat})) \div (LET b8412 == (CHOOSE b8413 \in {x \in 1..3 : x > 1} : FALSE) IN ([x \in 1..2 |-> x])[b8412] .. Cardinality({b8414 : b8414 \in {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    <<3, 1, 2>>
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    <<3, 1, 2>>
---*)

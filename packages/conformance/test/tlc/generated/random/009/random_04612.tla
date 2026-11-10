(*---
description: Evaluates a random int expression, seed 262, number 4612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {{2147483647, <<3, 1, 2>>}, UNION {1..3, {x \in 1..3 : x > 1}}}) + LET b7222 == ([[a |-> 1] EXCEPT !.a = -1]).a IN ((CHOOSE b7223 \in {} : TRUE) \div (-2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04612 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<3, 1, 2>> with the value:
    2147483647
---*)

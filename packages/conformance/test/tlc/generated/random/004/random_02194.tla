(*---
description: Evaluates a random set expression, seed 262, number 2194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((7 - 7) - (-2)), Cardinality(({2, 1, 3} \cup SUBSET {1}))} \ ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) \ {(-2147483647), (3 + 2)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02194 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    2
---*)

(*---
description: Evaluates a random set expression, seed 262, number 7653.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07653 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {UNION {{2, 1, 3}, SUBSET {1}}, {1 : b11780 \in {1}}}) .. {b11781 \in (IF TRUE THEN 3 ELSE 3 .. (0 - 2147483647)) : ((<<1>> = (1 :> 2)) => (0 = 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07653 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 1 with non-integer:
    {1}
---*)

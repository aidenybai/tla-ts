(*---
description: Evaluates a random function expression, seed 262, number 9505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![(-(2 \div 1))] = Cardinality(DOMAIN -1)] @@ [b14761 \in (IF TRUE THEN 1 ELSE 2 .. ([a |-> 1]).a) |-> (-Cardinality(2..1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 62 of module random_09505
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09505 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the integer 1.
---*)

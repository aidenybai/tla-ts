(*---
description: Evaluates a random function expression, seed 262, number 5967.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05967 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE) @@ (CHOOSE f \in [1..2 -> {1}] : TRUE)) @@ ([b9201 \in UNION {Nat, <<3, 1, 2>>} |-> (b9201 * <<>>)] @@ [b9202 \in ({2, 1, 3} \cup {2, 1, 3}) |-> Cardinality({1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05967 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<3, 1, 2>> with the value:
    Nat
---*)

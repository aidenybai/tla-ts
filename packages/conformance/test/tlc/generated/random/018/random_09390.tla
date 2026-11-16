(*---
description: Evaluates a random record expression, seed 262, number 9390.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09390 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b14569 \in DOMAIN (1 :> 2) : (b14569 = 0)}, (({2, 1, 3} \ {x \in 1..3 : x > 1}) = {7, -1})} \cap (CASE ([a |-> 1] = [a |-> 1]) -> ([a |-> 1]).a [] OTHER -> Head(<<>>) .. ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE))[Cardinality(SUBSET {1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09390 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean FALSE with non-boolean:
    {}
---*)

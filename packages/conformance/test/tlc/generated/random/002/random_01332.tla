(*---
description: Evaluates a random set expression, seed 262, number 1332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([a |-> <<>>, b |-> FALSE]).a, (CASE FALSE -> 3 [] OTHER -> 2 \div (2 + 2))} \ DOMAIN ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) @@ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01332 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

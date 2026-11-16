(*---
description: Evaluates a random set expression, seed 262, number 9972.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09972 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN ([x \in Nat |-> x + 1] @@ (1 :> 2)) \cap {(CHOOSE b15506 \in 2..1 : TRUE), (0 - 7)}), UNION {{(2147483647 * b15507) : b15507 \in ({} \ 2..1)}, (IF TRUE THEN 2 ELSE 2147483647 .. (CHOOSE b15508 \in {1} : TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09972 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

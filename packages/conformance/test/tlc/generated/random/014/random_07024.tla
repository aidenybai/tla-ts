(*---
description: Evaluates a random bool expression, seed 262, number 7024.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10774 \in DOMAIN [([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) EXCEPT ![(<<1>> % -1)] = (<<5, 6>>)[0]] : ((Len(<<>>) * Len(<<1, 2>>)) \in UNION {UNION {Nat, 2..1}, ({} \cap 2..1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07024 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)

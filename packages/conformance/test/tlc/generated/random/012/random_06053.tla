(*---
description: Evaluates a random set expression, seed 262, number 6053.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9324 \in {b9325 \in ({1, 2147483647} \cup (CHOOSE b9326 \in 2..1 : TRUE)) : ((\E b9327 \in 1..3 : FALSE) /\ (b9325 = b9325))} : (UNION {({1} \ SUBSET {1}), (SUBSET {1} \ {2, 1, 3})} \subseteq {<<b9324, b9324>>, CASE FALSE -> b9324 [] OTHER -> 2147483647})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06053 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 61 to line 14, col 88 of module random_06053
---*)

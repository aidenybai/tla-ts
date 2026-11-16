(*---
description: Evaluates a random bool expression, seed 262, number 1140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF {b1829 \in {} : FALSE} THEN (2 * 7) ELSE (b1828 \/ FALSE) : b1828 \in (UNION {{1}, Nat} \cap ({x \in 1..3 : x > 1} \ {1}))} = UNION {{Len(<<>>), ((1 :> 2))[[x \in Nat |-> x + 1]]}, {Len(<<1>>), ([x \in 1..2 |-> x])[2147483647]}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01140 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)

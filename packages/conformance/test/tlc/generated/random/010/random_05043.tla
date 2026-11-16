(*---
description: Evaluates a random bool expression, seed 262, number 5043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b7839 \in DOMAIN (CHOOSE f \in [{1} -> {1}] : TRUE) : ((Nat \subseteq SUBSET {1}) <=> (FALSE /\ [a |-> 1]))) /\ (((-2) \div CASE FALSE -> 2147483647 [] OTHER -> 7) = LET b7840 == Cardinality({x \in 1..3 : x > 1}) IN (b7840 - 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05043 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 77 to line 14, col 100 of module random_05043
---*)

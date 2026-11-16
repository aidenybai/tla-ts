(*---
description: Evaluates a random set expression, seed 262, number 5282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq([<<3, 1, 2>> EXCEPT ![1] = 1], LAMBDA p, q : p < q)) .. IF ((Nat \cup 2..1) \subseteq ({1, 2} \cup 1..3)) THEN (Cardinality({}) \div (SUBSET {1} = {})) ELSE ((CHOOSE r \in [a : 1..2] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05282 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 90 to line 14, col 133 of module random_05282
---*)

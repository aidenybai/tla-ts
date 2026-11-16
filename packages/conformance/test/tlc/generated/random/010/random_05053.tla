(*---
description: Evaluates a random int expression, seed 262, number 5053.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b7861 \in (((2 .. 1) \cup (1 .. 7)) \ UNION {{b7862 \in {1} : TRUE}, {-1, 7}}) : (\A b7863 \in UNION {{b7864 \in 1..3 : TRUE}, UNION {2..1, {1, 2}}} : (({1} = SUBSET {1}) <=> (Nat \subseteq 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05053 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 200 to line 14, col 217 of module random_05053
---*)

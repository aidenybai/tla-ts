(*---
description: Evaluates a random bool expression, seed 262, number 1733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\A b2756 \in (2..1 \cap SUBSET {1}) : (TRUE <=> FALSE)) <=> ((TRUE /\ TRUE) /\ ((1 :> 2) \subseteq {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01733 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 100 to line 14, col 120 of module random_01733
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 4254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((7 \in {2, 1, 3}) <=> ([a |-> 1] \subseteq Nat)) <=> ([[a |-> 1] EXCEPT !.a = 1] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + {}]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04254 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 43 to line 14, col 65 of module random_04254
---*)

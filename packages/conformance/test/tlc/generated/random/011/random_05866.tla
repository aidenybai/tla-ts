(*---
description: Evaluates a random bool expression, seed 262, number 5866.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05866 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(SUBSET {1} \cap SUBSET {1})) /\ (UNION {{1}, 2..1} \subseteq (Nat \ <<3, 1, 2>>))) \/ ((({x \in 1..3 : x > 1} \cap {}) \ ({2, 1, 3} \ Nat)) \subseteq {(b9048 + b9048) : b9048 \in {TRUE : b9049 \in Nat}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05866 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form S \cap T)
    line 14, col 19 to line 14, col 47 of module random_05866
---*)

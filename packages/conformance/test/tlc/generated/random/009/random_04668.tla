(*---
description: Evaluates a random bool expression, seed 262, number 4668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b7292 \in ({b7293 \in 1..3 : FALSE} \cap {1, 2}) : (<<2, 0>> = (CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE))) <=> (\A b7294 \in (UNION {{2, 1, 3}, 2..1} \ UNION {{}, 2..1}) : ((\E b7295 \in 7 : TRUE) <=> (\A b7296 \in SUBSET {1} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04668 failed.
    TLC encountered a non-enumerable quantifier bound
    7.
    7
---*)

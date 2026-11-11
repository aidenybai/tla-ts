(*---
description: Evaluates a random bool expression, seed 262, number 271.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00271 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Append(<<1, 2>>, 2) \ ({x \in 1..3 : x > 1} \cap {1})) \cap DOMAIN (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE)) = (CHOOSE b458 \in {LET b459 == 7 IN b459, LET b460 == 1 IN b460} : ((7 = b458) = (0 + 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00271 failed.
    Attempted to check set membership in a tuple value.
---*)

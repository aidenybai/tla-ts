(*---
description: Evaluates a random bool expression, seed 262, number 4472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7038 \in {0, 3} : (FALSE \/ TRUE)) % (LET b7039 == 2 IN b7039 - (CHOOSE b7040 \in {2, 1, 3} : TRUE))) \in ((UNION {{x \in 1..3 : x > 1}, 1..3} \ ({} \ {x \in 1..3 : x > 1})) \ (([a |-> 1]).a < Len(TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04472 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)

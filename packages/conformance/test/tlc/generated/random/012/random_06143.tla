(*---
description: Evaluates a random bool expression, seed 262, number 6143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-7) * Cardinality({1})) = [a |-> (3 * 7), b |-> (FALSE \/ TRUE)]) => (\E b9442 \in {LET b9444 == b9443 IN b9443 : b9443 \in {2, 7}} : (\E b9445 \in {b9446 : b9446 \in SUBSET {1}} : (\A b9447 \in 1..3 : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06143 failed.
    Attempted to check equality of integer -7 with non-integer:
    [a |-> 21, b |-> TRUE]
---*)

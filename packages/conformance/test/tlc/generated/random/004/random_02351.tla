(*---
description: Evaluates a random bool expression, seed 262, number 2351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(Append(<<1>>, 0))) = IF ((2 < 3) <=> (\E b3723 \in {1, 2} : TRUE)) THEN ({b3724 : b3724 \in 2..1} \cup (2 .. 2147483647)) ELSE ((CHOOSE b3725 \in {} : TRUE) * Cardinality(SUBSET {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02351 failed.
    Attempted to check equality of integer 0 with non-integer:
    2..2147483647
---*)

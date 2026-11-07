(*---
description: Evaluates a random bool expression, seed 262, number 9855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((0 \in {1, 2}) /\ (~FALSE)) \/ (Head(<<1>>) = (CHOOSE b15299 \in SUBSET {1} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09855 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)

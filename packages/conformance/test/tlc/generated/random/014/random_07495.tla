(*---
description: Evaluates a random int expression, seed 262, number 7495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(CHOOSE b11546 \in ({7, <<1, 2>>} \cap ({1} \cup {1, 2})) : (LET b11547 == b11546 IN b11546 \in ({} \cup {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07495 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<1, 2>>
---*)

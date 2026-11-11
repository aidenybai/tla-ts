(*---
description: Evaluates a random int expression, seed 262, number 2477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(((Nat \cup {}) \cap {1 : b3896 \in {1}})).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02477 failed.
    Attempted to select field "a" from a non-record value {1}
    line 14, col 18 to line 14, col 61 of module random_02477
---*)

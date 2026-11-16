(*---
description: Evaluates a random int expression, seed 262, number 7492.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07492 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({}) \in DOMAIN [x \in 1..2 |-> x]) => ((TRUE => FALSE) <=> (<<1, 2>> = <<5, 6>>)))).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07492 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 16 to line 14, col 115 of module random_07492
---*)

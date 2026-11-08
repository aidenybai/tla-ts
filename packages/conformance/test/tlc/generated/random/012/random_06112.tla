(*---
description: Evaluates a random int expression, seed 262, number 6112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> LET b9405 == Head(<<1>>) IN (2147483647 \div 0), b |-> ({b9406 \in {} : FALSE} \subseteq (2..1 \cap SUBSET {1}))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06112 failed.
    2179:0 The second argument of \div is 0.
---*)

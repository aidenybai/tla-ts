(*---
description: Evaluates a random bool expression, seed 262, number 2152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail((<<1>> \o <<>>))) = ((CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE))[(([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))[LET b3403 == 2 IN b3403]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02152 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

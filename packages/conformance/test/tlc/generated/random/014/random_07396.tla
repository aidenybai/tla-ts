(*---
description: Evaluates a random bool expression, seed 262, number 7396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b11391 == 0 IN b11391 \in {1 : b11392 \in FALSE}) <=> (([a |-> 1] = [a |-> 1, b |-> TRUE]) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1]))) \/ (((<<>> = <<5, 6>>) \/ (<<1>> = <<>>)) \subseteq {(-3) : b11393 \in (0 .. -1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07396 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 65 to line 14, col 69 of module random_07396
---*)

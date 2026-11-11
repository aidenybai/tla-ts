(*---
description: Evaluates a random set expression, seed 262, number 1503.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01503 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {UNION {DOMAIN <<5, 6>>, UNION {{}, TRUE}}, DOMAIN (<<5, 6>> @@ <<5, 6>>)} \cap ((([a |-> 1, b |-> TRUE]).a .. ([x \in Nat |-> x + 1])[1]) \cup UNION {{b2396 : b2396 \in 1..3}, {1 : b2397 \in {1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01503 failed.
    Attempted to compare boolean TRUE with non-boolean:
    {}
---*)

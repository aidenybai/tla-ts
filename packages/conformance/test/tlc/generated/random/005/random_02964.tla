(*---
description: Evaluates a random bool expression, seed 262, number 2964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(2 < SUBSET {1})) => ((2147483647 * 0) < (3 + 0))) \/ ((([x \in 1..2 |-> x] @@ <<5, 6>>))[Cardinality({})] = Head(Tail(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02964 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    {{}, {1}}
---*)

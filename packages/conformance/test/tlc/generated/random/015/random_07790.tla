(*---
description: Evaluates a random bool expression, seed 262, number 7790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \ (1..3 \ {2, 1, 3})) \ UNION {UNION {{}, {x \in 1..3 : x > 1}}, [a |-> 3, b |-> TRUE]}) \subseteq (((2 % 0) * Len(<<3, 1, 2>>)) .. (Len(<<>>) % LET b12015 == 2 IN 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07790 failed.
    Attempted to compare record:
    [a |-> 3, b |-> TRUE]
    with non-record
    {2, 3}
---*)

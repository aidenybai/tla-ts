(*---
description: Evaluates a random bool expression, seed 262, number 4415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([a |-> 1, b |-> [a |-> 1, b |-> TRUE]] = {b6948 : b6948 \in {}}) -> Cardinality((2147483647 .. 0)) [] OTHER -> [a |-> (3 + 7), b |-> [<<5, 6>> EXCEPT ![3] = 2147483647]] < (SelectSeq(SubSeq(<<>>, 2, 2147483647), LAMBDA e : e > 0))[(-(CHOOSE r \in [a : 2..1] : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04415 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> [a |-> 1, b |-> TRUE]]
    with non-record
    {}
---*)

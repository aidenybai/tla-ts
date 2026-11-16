(*---
description: Evaluates a random bool expression, seed 262, number 8786.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08786 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]) => ((1 \in SUBSET {1}) \subseteq (<<1>> \cup <<5, 6>>))) <=> UNION {(DOMAIN [x \in Nat |-> x + 1] \cap (7 .. 7)), [a |-> (3 * 1), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08786 failed.
    Attempted to compare an integer with non-integer:
    "a".
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 1155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = (7 - 2147483647)] = [SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = CASE TRUE -> {2, 1, 3} [] OTHER -> -1]) => (<<Cardinality(SUBSET {1}), (-1)>> = (CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01155 failed.
    Attempted to check equality of record:
    [a |-> -2147483640, b |-> TRUE]
    with non-record
    <<{1, 2, 3}, 1, 2>>
---*)

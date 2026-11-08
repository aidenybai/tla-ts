(*---
description: Evaluates a random bool expression, seed 262, number 6107.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06107 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail([Append(<<>>, 3) EXCEPT ![1] = Cardinality(Nat)]) => (~(SubSeq(<<1, 2>>, -1, 2147483647) => (SUBSET {1} \subseteq 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06107 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

(*---
description: Evaluates a random function expression, seed 262, number 1734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b2757 \in {1} |-> 1] @@ [b2758 \in {1, 2} |-> -1]) @@ [b2759 \in {{1}, 2147483647} |-> Head(<<>>)]) @@ ((Head(<<>>) * Len(<<3, 1, 2>>)) :> (([a |-> 1]).a \div Cardinality({})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01734 failed.
    Attempted to compare integer 2147483647 with non-integer:
    {1}
---*)

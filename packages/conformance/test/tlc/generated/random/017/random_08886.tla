(*---
description: Evaluates a random record expression, seed 262, number 8886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b13765 == LET b13766 == [a |-> 0, b |-> [a |-> 1]] IN Cardinality(Nat) IN Head(SortSeq(<<>>, LAMBDA p, q : p < q)), b |-> (SelectSeq([<<1>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0) = [((1 :> 2) @@ <<5, 6>>) EXCEPT ![LET b13767 == 2147483647 IN b13767] = ([a |-> 1, b |-> TRUE]).a])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08886 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

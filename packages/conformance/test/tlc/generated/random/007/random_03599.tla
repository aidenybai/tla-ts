(*---
description: Evaluates a random bool expression, seed 262, number 3599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5676 \in {CASE (7 \in {1}) -> (-1) [] OTHER -> (CHOOSE b5678 \in {2, 1, 3} : FALSE) : b5677 \in (UNION {{2, 1, 3}, [a |-> 1, b |-> TRUE]} \cap SortSeq(<<1>>, LAMBDA p, q : p < q))} : (\E b5679 \in {b5680 \in DOMAIN <<5, 6>> : (~FALSE)} : ({b5681 \in Nat : FALSE} = {b5682 \in {1} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03599 failed.
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    {1, 2, 3}
---*)

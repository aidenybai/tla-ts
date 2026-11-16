(*---
description: Evaluates a random bool expression, seed 262, number 437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b713 \in (({2, 1, 3} \cup Nat) \ (2 .. 2)) : ((0 :> 2) = [[a |-> 1] EXCEPT !.a = 1])) \subseteq [Tail(SortSeq(<<>>, LAMBDA p, q : p < q)) EXCEPT ![1] = Cardinality({{1, 2}, 0})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00437 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    Nat
    are not both enumerable
---*)

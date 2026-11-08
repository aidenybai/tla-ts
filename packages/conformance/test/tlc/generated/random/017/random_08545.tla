(*---
description: Evaluates a random function expression, seed 262, number 8545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<>>, LAMBDA p, q : p < q)) :> Len(Append(<<1>>, 3))) @@ (([Nat EXCEPT ![1] = 1] = [b13244 \in Nat |-> b13244]) <=> (CASE TRUE -> 7 [] OTHER -> 2 \in ({x \in 1..3 : x > 1} \cup {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08545 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

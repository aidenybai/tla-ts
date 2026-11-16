(*---
description: Evaluates a random int expression, seed 262, number 2640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b4169 \in (((1 :> 7) @@ [b4170 \in 1..3 |-> b4170]) \cup {b4171 \in SortSeq(<<1, 2>>, LAMBDA p, q : p < q) : (<<1, 2>> = [x \in Nat |-> x + 1])}) : (([b4172 \in {} |-> b4172])[(b4169 % 0)] < (Head(<<>>) * (1 - b4169)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02640 failed.
    Attempted to enumerate S \cup T when S:
    <<7, 2, 3>>
    and T:
    {b4171 \in <<1, 2>> : <expression line 14, col 134 to line 14, col 165 of module random_02640> }
    are not both enumerable
---*)

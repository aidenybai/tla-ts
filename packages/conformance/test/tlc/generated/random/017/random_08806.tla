(*---
description: Evaluates a random seq expression, seed 262, number 8806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT ![1] = (([x \in 1..2 |-> x] @@ (1 :> 2)))[([a |-> 1]).a]] \o Append(([(1 :> 2) EXCEPT ![1] = [x \in 1..2 |-> x]] \o Tail(<<3, 1, 2>>)), Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08806 failed.
    Attempted to access record by a non-string argument: 1
---*)

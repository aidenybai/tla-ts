(*---
description: Evaluates a random bool expression, seed 262, number 9805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(SelectSeq(<<-1, 1>>, LAMBDA e : e > 0), LAMBDA e : e > 0) = ([[[x \in 1..2 |-> x] EXCEPT ![2147483647] = 3] EXCEPT ![(CHOOSE b15214 \in SUBSET {1} : FALSE)] = [<<3, 1, 2>> EXCEPT ![1] = 7]] @@ [b15215 \in (SUBSET {1} \cup Nat) |-> (CHOOSE r \in [a : {2, 1, 3}] : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 90 to line 14, col 107 of module random_09805
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09805 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 145 to line 14, col 180 of module random_09805
---*)

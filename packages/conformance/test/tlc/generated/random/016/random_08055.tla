(*---
description: Evaluates a random record expression, seed 262, number 8055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b12442 \in {b12443 \in {2, 1, 3} : FALSE} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])), b |-> [[a |-> -1, b |-> TRUE] EXCEPT !.a = ([x \in Nat |-> x + 1])[2]]] EXCEPT !.a = @ + Append(SelectSeq([<<1, 2>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0), (CHOOSE b12444 \in {2 : b12445 \in 1..3} : (b12444 \in {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08055 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 122 of module random_08055
---*)

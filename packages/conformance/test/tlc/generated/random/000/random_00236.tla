(*---
description: Evaluates a random seq expression, seed 262, number 236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SortSeq([<<3, 1, 2>> EXCEPT ![1] = 7], LAMBDA p, q : p < q) \o Append(Append(<<>>, 7), ([a |-> 1, b |-> TRUE]).a)) EXCEPT ![1] = IF ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] = (CHOOSE r \in [a : {1}] : TRUE)) THEN ((1 :> 2147483647))[(0 + 1)] ELSE ([[x \in Nat |-> x + 1] EXCEPT ![TRUE] = 3])[Head(<<>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00236 failed.
    2158:0 Attempted to check if the value:
    TRUE
    is an element of Nat.
---*)

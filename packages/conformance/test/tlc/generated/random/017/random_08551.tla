(*---
description: Evaluates a random function expression, seed 262, number 8551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b13254 \in UNION {{}, Nat} |-> ((1 :> 2))[SUBSET {1}]])[((CHOOSE r \in [a : {}] : TRUE)).a] :> ((-(7 % 0)) % ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08551 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 104 of module random_08551
---*)

(*---
description: Evaluates a random int expression, seed 262, number 953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([[x \in 1..2 |-> x] EXCEPT ![7] = 3] @@ (2147483647 :> 2147483647)) EXCEPT ![([a |-> 1, b |-> TRUE]).a] = ((CHOOSE b1533 \in [a |-> 1, b |-> TRUE] : TRUE) \div ((1 :> 2))[2147483647])])[LET b1534 == (LET b1535 == -1 IN b1535 + [a |-> -1, b |-> FALSE]) IN {b1536 \in ({1, 2} \cup {1}) : [[x \in 1..2 |-> x] EXCEPT ![-1] = 0]}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 37 of module random_00953
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00953 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 127 to line 14, col 171 of module random_00953
---*)

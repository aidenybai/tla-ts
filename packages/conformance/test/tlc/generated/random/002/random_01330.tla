(*---
description: Evaluates a random set expression, seed 262, number 1330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b2132 == (CHOOSE b2133 \in Tail(<<1>>) : (~FALSE)) IN Head(Append(<<1, 2>>, b2132)) .. Head([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT ![1] = LET b2134 == 7 IN b2134])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01330 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 31 to line 14, col 69 of module random_01330
---*)

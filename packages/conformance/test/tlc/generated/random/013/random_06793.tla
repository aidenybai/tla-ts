(*---
description: Evaluates a random int expression, seed 262, number 6793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10421 \in DOMAIN [b10422 \in (0 - 2147483647) |-> Len(<<1, 2>>)] : ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = b10421] EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a] <=> ([[a |-> 1] EXCEPT !.a = @ + b10421] = [Nat EXCEPT !.a = @ + -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06793 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 17 to line 14, col 251 of module random_06793
---*)

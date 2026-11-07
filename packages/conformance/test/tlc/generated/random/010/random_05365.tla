(*---
description: Evaluates a random record expression, seed 262, number 5365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b8298 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE \/ TRUE)), b |-> (~(SUBSET {1} = {2, 1, 3}))] EXCEPT !.a = @ + ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05365 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 25 to line 14, col 86 of module random_05365
---*)

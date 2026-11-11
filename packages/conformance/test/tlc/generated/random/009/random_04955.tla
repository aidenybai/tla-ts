(*---
description: Evaluates a random record expression, seed 262, number 4955.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04955 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([a |-> (CHOOSE b7708 \in Nat : FALSE), b |-> (FALSE \/ TRUE)]).a, b |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = Len(<<>>)] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = Cardinality({})])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04955 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 32 to line 14, col 59 of module random_04955
---*)

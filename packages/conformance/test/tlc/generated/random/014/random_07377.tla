(*---
description: Evaluates a random bool expression, seed 262, number 7377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~([[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = @ + ([a |-> 1]).a] = [(\A b11359 \in [a |-> 1] : FALSE) EXCEPT !.a = @ + (-1 - 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07377 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1].
    line 14, col 97 to line 14, col 105 of module random_07377
---*)

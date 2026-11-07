(*---
description: Evaluates a random record expression, seed 262, number 59.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00059 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = @ + (CHOOSE b84 \in Nat : FALSE)]).a, b |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + ([a |-> 1]).a] \subseteq {b85 \in UNION {{2, 1, 3}, 2..1} : (Nat \subseteq {1})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00059 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 74 to line 14, col 99 of module random_00059
---*)

(*---
description: Evaluates a random set expression, seed 262, number 4625.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04625 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b7240 \in {b7241 \in DOMAIN <<5, 6>> : (TRUE => FALSE)} : ([[a |-> 1] EXCEPT !.a = @ + b7240] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1])} \cup ((CHOOSE b7242 \in (1 - 1) : (0 \in {1})) .. (CASE TRUE -> 0 [] OTHER -> 7 + (3 - 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04625 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 163 to line 14, col 200 of module random_04625
---*)

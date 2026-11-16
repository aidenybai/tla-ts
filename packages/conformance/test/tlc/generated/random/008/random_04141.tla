(*---
description: Evaluates a random record expression, seed 262, number 4141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (CHOOSE b6522 \in {b6523 \in {b6524 \in {1} : TRUE} : (7 < b6523)} : (Head(<<3, 1, 2>>) \in UNION {{1, 2}, {2, 1, 3}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04141 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 68 to line 14, col 184 of module random_04141
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 1133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<IF (FALSE => [a |-> 1]) THEN (CHOOSE b1815 \in {1, 2} : FALSE) ELSE (-1 - 2), Head((<<>> \o <<1, 2>>))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01133 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 53 to line 14, col 83 of module random_01133
---*)

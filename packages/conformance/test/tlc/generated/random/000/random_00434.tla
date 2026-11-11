(*---
description: Evaluates a random record expression, seed 262, number 434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(<<[[x \in 1..2 |-> x] EXCEPT ![2147483647] = 0], ([x \in 1..2 |-> x])[2]>>), b |-> ((CHOOSE r \in [a : {}] : TRUE) = [(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (0 + 3)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 31 to line 14, col 48 of module random_00434
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00434 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 113 to line 14, col 140 of module random_00434
---*)

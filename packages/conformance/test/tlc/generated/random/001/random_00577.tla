(*---
description: Evaluates a random record expression, seed 262, number 577.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00577 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Len(<<1, 2>>), b |-> ([a |-> 1] = [a |-> 1, b |-> TRUE])] EXCEPT !.a = (CHOOSE b975 \in UNION {1..3, {}} : (FALSE <=> TRUE))] EXCEPT !.a = ([[a |-> -1, b |-> TRUE] EXCEPT !.a = @ + ([x \in 1..2 |-> x])[FALSE]]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00577 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 97 to line 14, col 147 of module random_00577
---*)

(*---
description: Evaluates a random function expression, seed 262, number 1219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1957 \in ((CHOOSE b1958 \in {7, 2} : (FALSE \/ FALSE)) .. ((1..3 \ SUBSET {1}) \cap UNION {Nat, {2, 1, 3}})) |-> ([a |-> IF FALSE THEN b1957 ELSE b1957, b |-> ([x \in Nat |-> x + 1] = (1 :> 2))]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01219 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 29 to line 14, col 70 of module random_01219
---*)

(*---
description: Evaluates a random int expression, seed 262, number 2162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CHOOSE b3415 \in UNION {{}, 2..1} : (<<3, 1, 2>> = [x \in Nat |-> x + 1])), b |-> ((CHOOSE r \in [a : 1..2] : TRUE) = (CHOOSE r \in [a : {}] : TRUE))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02162 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 97 of module random_02162
---*)

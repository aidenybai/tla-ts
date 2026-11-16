(*---
description: Evaluates a random function expression, seed 262, number 2321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3673 \in DOMAIN ((CHOOSE b3674 \in 1..3 : FALSE) :> CASE TRUE -> 1 [] OTHER -> 1) |-> ((-(3 - b3673)) + ([b3675 \in {} |-> b3673])[IF TRUE THEN 7 ELSE b3673])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02321 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 36 to line 14, col 64 of module random_02321
---*)

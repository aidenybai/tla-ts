(*---
description: Evaluates a random set expression, seed 262, number 1266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN [b2018 \in {b2019 \in {1} : [x \in 1..2 |-> x]} |-> Cardinality(2..1)], (((1 * 7) % LET b2020 == 3 IN 2) .. LET b2021 == CASE <<>> -> 3 [] OTHER -> 3 IN Cardinality(1..3))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01266 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 58 to line 14, col 75 of module random_01266
---*)

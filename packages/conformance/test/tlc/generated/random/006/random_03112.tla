(*---
description: Evaluates a random int expression, seed 262, number 3112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b4965 \in {1} |-> -1] @@ [<<5, 6>> EXCEPT ![TRUE] = 0]))[LET b4966 == LET b4967 == 2147483647 IN b4967 IN ([x \in 1..2 |-> x])[1]] % ((CHOOSE b4968 \in (2..1 \cup {x \in 1..3 : x > 1}) : (~TRUE)) \div (LET b4969 == -1 IN 1 - ([x \in 1..2 |-> x])[-1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03112 failed.
    Attempted to access tuple at a non integral index: TRUE
---*)

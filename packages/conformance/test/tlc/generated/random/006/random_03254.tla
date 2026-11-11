(*---
description: Evaluates a random int expression, seed 262, number 3254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((CHOOSE b5173 \in {b5174 : b5174 \in {}} : (\E b5175 \in {x \in 1..3 : x > 1} : TRUE)) = (CHOOSE b5176 \in {b5177 : b5177 \in {}} : (b5176 < 2147483647))) -> (({7 : b5178 \in {}} \cap [[a |-> 1] EXCEPT !.a = 2147483647])).a [] OTHER -> ((([a |-> 1] % 2147483647) :> (2147483647 * 3)))[(Cardinality({1}) * LET b5179 == -1 IN b5179)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03254 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 23 to line 14, col 106 of module random_03254
---*)

(*---
description: Evaluates a random record expression, seed 262, number 9961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + (CASE FALSE -> 7 [] OTHER -> -1 - (-2))] EXCEPT !.a = (CHOOSE b15487 \in {(-b15488) : b15488 \in {b15489 \in {x \in 1..3 : x > 1} : TRUE}} : (({x \in 1..3 : x > 1} = {}) <=> (2147483647 < -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09961 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_09961
---*)

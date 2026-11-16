(*---
description: Evaluates a random set expression, seed 262, number 2496.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02496 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([[a |-> 1] EXCEPT !.a = @ + b3928]).a * ((CHOOSE b3929 \in {x \in 1..3 : x > 1} : FALSE) - Len(<<1>>))) : b3928 \in {CASE (FALSE <=> TRUE) -> (CHOOSE b3930 \in {} : FALSE) [] OTHER -> (2 % 2147483647), ((7 % 1) + Head(<<3, 1, 2>>))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02496 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 61 to line 14, col 105 of module random_02496
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 1485.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01485 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b2374 \in {b2375 \in (CHOOSE r \in [a : 2..1] : TRUE) : (CHOOSE r \in [a : 1..2] : TRUE)} : ((TRUE => FALSE) => (~FALSE))) < ([(CHOOSE f \in [2..1 -> 1..2] : TRUE) EXCEPT ![(1 + 2)] = CASE TRUE -> 0 [] OTHER -> 2])[((0 % 3) + DOMAIN <<5, 6>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01485 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 47 to line 14, col 76 of module random_01485
---*)

(*---
description: Evaluates a random function expression, seed 262, number 2125.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02125 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3368 \in {((2147483647 - -1) - (CHOOSE b3369 \in 1..3 : TRUE)), (CHOOSE b3370 \in DOMAIN [x \in Nat |-> x + 1] : (FALSE \/ FALSE))} |-> ((-(2 % b3368)) + (Len(<<>>) - Cardinality(1..3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02125 failed.
    2178:0 Overflow when computing 2147483647--1
---*)

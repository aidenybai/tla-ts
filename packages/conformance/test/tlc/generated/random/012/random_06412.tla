(*---
description: Evaluates a random function expression, seed 262, number 6412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b9864 == Head(<<>>) IN (3 \div 0), CASE (FALSE => TRUE) -> (CHOOSE b9865 \in 2..1 : FALSE) [] OTHER -> (2 % 0)} :> CASE (\A b9866 \in DOMAIN [x \in 1..2 |-> x] : (2147483647 < 3)) -> (Cardinality({}) % Head(<<3, 1, 2>>)) [] OTHER -> (-LET b9867 == 2 IN b9867)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06412 failed.
    2179:0 The second argument of \div is 0.
---*)

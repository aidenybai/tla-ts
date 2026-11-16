(*---
description: Evaluates a random function expression, seed 262, number 7808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12047 \in (Head((<<3, 1, 2>> \o <<1, 2>>)) :> IF (TRUE \/ FALSE) THEN (CHOOSE b12048 \in {1, 2} : FALSE) ELSE IF FALSE THEN 7 ELSE 2) |-> CASE ((3 = b12047) /\ (TRUE /\ TRUE)) -> Cardinality(DOMAIN <<>>) [] OTHER -> LET b12049 == (b12047 \in {}) IN Head(<<>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07808 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 89 to line 14, col 120 of module random_07808
---*)

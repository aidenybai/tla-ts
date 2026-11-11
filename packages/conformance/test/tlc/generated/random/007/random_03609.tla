(*---
description: Evaluates a random bool expression, seed 262, number 3609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 2..1] : TRUE) \in {CASE (TRUE => TRUE) -> Cardinality(1..3) [] OTHER -> (CHOOSE b5696 \in {1} : TRUE) : b5695 \in {b5697 \in (2..1 \cup {2, 1, 3}) : {b5698 \in {1} : FALSE}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03609 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_03609
---*)

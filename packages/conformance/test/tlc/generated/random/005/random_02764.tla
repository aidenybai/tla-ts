(*---
description: Evaluates a random int expression, seed 262, number 2764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Cardinality({}), b |-> ({1} \subseteq {x \in 1..3 : x > 1})]).a % Head(LET b4360 == (CHOOSE b4361 \in {1} : TRUE) IN CASE FALSE -> 1 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02764 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    2147483647
---*)

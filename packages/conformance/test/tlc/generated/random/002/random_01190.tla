(*---
description: Evaluates a random int expression, seed 262, number 1190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((({1, Nat} \cap UNION {1..3, {2, 1, 3}}) \ {b1906 \in (1 .. 2147483647) : (TRUE => TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01190 failed.
    Attempted to check if the value:
    Nat
    is in the integer interval 1..3
---*)

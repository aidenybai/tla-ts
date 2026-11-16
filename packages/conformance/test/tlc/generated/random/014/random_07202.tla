(*---
description: Evaluates a random int expression, seed 262, number 7202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Cardinality(({2147483647 : b11067 \in SUBSET {1}} \ {b11068 \in 2147483647 : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07202 failed.
    Attempted to check if the value:
    2147483647
    is an element of the integer 2147483647
---*)

(*---
description: Evaluates a random int expression, seed 262, number 4015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((({1, 1} \ (-1 .. 2)) \cup (UNION {{2, 1, 3}, {1}} \cap LET b6303 == <<>> IN 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04015 failed.
    Attempted to check if the value:
    2
    is an element of the integer 3
---*)

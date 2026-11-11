(*---
description: Evaluates a random int expression, seed 262, number 2101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-[[<<1, 3>> EXCEPT !.a = @ + (3 * 2147483647)] EXCEPT !.a = @ + Cardinality((1 .. 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02101 failed.
    Attempted to access tuple at a non integral index: "a"
---*)

(*---
description: Evaluates a random set expression, seed 262, number 6653.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06653 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE (TRUE = 0) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> (7 - b10206) : b10206 \in ((1 .. 3) \cap (0 .. 7))} \cup (DOMAIN (TRUE :> 0) \ ((3 .. 7) \ DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06653 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    0
---*)

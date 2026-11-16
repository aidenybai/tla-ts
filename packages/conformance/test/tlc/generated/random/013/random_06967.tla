(*---
description: Evaluates a random int expression, seed 262, number 6967.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06967 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> Cardinality((0 + 0)), b |-> ((1..3 \ Nat) \subseteq UNION {{2, 1, 3}, {}})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06967 failed.
    2181:0 Attempted to compute cardinality of the value
    0
---*)

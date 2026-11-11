(*---
description: Evaluates a random seq expression, seed 262, number 3266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<Cardinality((SUBSET {1} \ Nat)), ((CHOOSE b5200 \in {2, 1, 3} : TRUE) - (2 * 0))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03266 failed.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)

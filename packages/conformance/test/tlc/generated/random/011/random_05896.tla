(*---
description: Evaluates a random int expression, seed 262, number 5896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b9094 \in (CHOOSE b9095 \in (3 .. 0) : (<<3, 1, 2>> = (1 :> 2))) |-> (-Cardinality(1..3))])[Len((({1} \cup {2, 1, 3}) \subseteq (2..1 \cup 1..3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05896 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 29 to line 14, col 80 of module random_05896
---*)

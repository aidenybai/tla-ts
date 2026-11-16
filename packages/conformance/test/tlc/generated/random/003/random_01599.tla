(*---
description: Evaluates a random function expression, seed 262, number 1599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Len(<<1>>), b |-> ({2, 1, 3} = {2, 1, 3})]).a :> (CHOOSE b2556 \in UNION {(1..3 \cup 2..1), (Nat \cap 2..1)} : (Append(<<1>>, 7) = (CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01599 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 75 to line 14, col 199 of module random_01599
---*)

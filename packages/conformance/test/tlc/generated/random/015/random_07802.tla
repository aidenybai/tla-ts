(*---
description: Evaluates a random int expression, seed 262, number 7802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CHOOSE b12035 \in {7 : b12036 \in 1..3} : (b12035 = 3)), b |-> (DOMAIN (1 :> 2) \subseteq {b12037 : b12037 \in SUBSET {1}})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07802 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 78 of module random_07802
---*)

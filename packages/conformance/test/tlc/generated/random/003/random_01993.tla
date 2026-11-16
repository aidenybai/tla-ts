(*---
description: Evaluates a random set expression, seed 262, number 1993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(CHOOSE f \in [{0} \cup {1} -> {}] : TRUE) EXCEPT ![(Cardinality(Nat) + ((1 :> 2))[2147483647])] = Len([<<>> EXCEPT ![1] = 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01993 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 64 of module random_01993
---*)

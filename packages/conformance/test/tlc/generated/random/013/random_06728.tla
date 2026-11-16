(*---
description: Evaluates a random set expression, seed 262, number 6728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b10313 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE) : ((CHOOSE b10314 \in <<1, 2>> : TRUE) = (2147483647 % b10313))), (Cardinality(({} \cup 2..1)) + ([(1 :> 2) EXCEPT ![7] = 1])[(<<3, 1, 2>> /\ FALSE)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06728 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 44 to line 14, col 83 of module random_06728
---*)

(*---
description: Evaluates a random int expression, seed 262, number 1397.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01397 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{0} \cup {1} -> {}] : TRUE) @@ ((CHOOSE f \in [{0} \cup {1} -> {}] : TRUE) @@ (<<5, 6>> @@ (1 :> 2)))))[(-((CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE))[(CHOOSE r \in [a : {1, 2}] : TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01397 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 58 of module random_01397
---*)

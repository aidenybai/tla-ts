(*---
description: Evaluates a random int expression, seed 262, number 1031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b1658 \in {IF (<<1>> = (1 :> 2)) THEN (2147483647 + 7) ELSE (7 - b1659) : b1659 \in ({0, 0} \cap {-1, 1})} : (((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a \in ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01031 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 227 of module random_01031
---*)

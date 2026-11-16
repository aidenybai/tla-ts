(*---
description: Evaluates a random record expression, seed 262, number 774.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00774 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = ((CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE))[(CHOOSE b1267 \in {b1268 \in 2..1 : TRUE} : (<<3, 1, 2>> = <<5, 6>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00774 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 122 to line 14, col 188 of module random_00774
---*)

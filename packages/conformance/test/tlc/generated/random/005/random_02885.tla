(*---
description: Evaluates a random seq expression, seed 262, number 2885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE), (Len(Tail(<<3, 1, 2>>)) * (Cardinality({x \in 1..3 : x > 1}) \div (CHOOSE b4571 \in {1} : FALSE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02885 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 142 to line 14, col 169 of module random_02885
---*)

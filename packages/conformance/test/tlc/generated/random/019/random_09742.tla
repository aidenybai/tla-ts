(*---
description: Evaluates a random record expression, seed 262, number 9742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (Head(<<5, 6>>) = Len(<<1, 2>>)) THEN ((3 + 7) - Cardinality(1..3)) ELSE ((CHOOSE b15127 \in {1} : TRUE) % (CHOOSE b15128 \in SUBSET {1} : FALSE)), b |-> ((~(-1 < -1)) => ({b15129 \in {x \in 1..3 : x > 1} : <<3, 1, 2>>} \subseteq (-2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09742 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 134 to line 14, col 169 of module random_09742
---*)

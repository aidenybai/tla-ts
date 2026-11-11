(*---
description: Evaluates a random seq expression, seed 262, number 2710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF ((\A b4283 \in {} : TRUE) <=> (TRUE /\ FALSE)) THEN (-Head(<<1>>)) ELSE (CHOOSE b4284 \in DOMAIN <<5, 6>> : ([a |-> 1] = [a |-> 1, b |-> TRUE])), Cardinality(((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) \cap {b4285 : b4285 \in Nat}))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02710 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 94 to line 14, col 163 of module random_02710
---*)

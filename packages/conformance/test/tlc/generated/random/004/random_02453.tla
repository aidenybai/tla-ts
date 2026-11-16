(*---
description: Evaluates a random seq expression, seed 262, number 2453.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02453 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(((TRUE /\ FALSE) \/ (Nat \subseteq 2..1)), Cardinality({[x \in 1..2 |-> x] : b3864 \in {x \in 1..3 : x > 1}}), ((CHOOSE r \in [a : 1..2] : TRUE)).a), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02453 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 54 to line 14, col 71 of module random_02453
---*)

(*---
description: Evaluates a random function expression, seed 262, number 4922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7657 \in ({(CHOOSE b7658 \in SUBSET {1} : FALSE), (2..1)[-1]} \ DOMAIN [<<5, 6>> EXCEPT ![1] = 1]) |-> Cardinality({(<<>>)[7], (<<3, 1, 2>> + b7657)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04922 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 64 of module random_04922
---*)

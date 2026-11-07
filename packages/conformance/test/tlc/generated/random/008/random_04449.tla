(*---
description: Evaluates a random function expression, seed 262, number 4449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7000 \in DOMAIN (Cardinality({}) @@ (<<5, 6>> @@ (1 :> 2))) |-> (CHOOSE b7001 \in DOMAIN [(1 :> 2) EXCEPT ![7] = -1] : ((1 * 1) = Head(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    0
    2169:0 The first argument of @@ should be a function, but instead it is:
    0
---*)

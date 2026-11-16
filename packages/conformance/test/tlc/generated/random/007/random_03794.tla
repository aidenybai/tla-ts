(*---
description: Evaluates a random record expression, seed 262, number 3794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(<<([x \in Nat |-> x + 1])[7], (CHOOSE b5984 \in <<1, 2>> : TRUE)>>), b |-> ((({1} \cap {1, 2}) = (2..1 \ <<>>)) <=> (DOMAIN 2 = ({1} \cap {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03794 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 59 to line 14, col 90 of module random_03794
---*)

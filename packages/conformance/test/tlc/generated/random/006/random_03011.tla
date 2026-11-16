(*---
description: Evaluates a random record expression, seed 262, number 3011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(<<2, <<3, 1, 2>>>>), b |-> (UNION {[a |-> 1], {1}} = (Nat \ 1..3))] EXCEPT !.a = @ + (((2147483647 \in {}) + Head(<<>>)) + Cardinality(({1, 2} \cap Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03011 failed.
    Attempted to compare the set {1} with the value:
    [a |-> 1]
---*)

(*---
description: Evaluates a random set expression, seed 262, number 4586.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04586 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (({b7187 \in Nat : TRUE} \ {b7188 \in {1, 2} : FALSE}) @@ [(CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) EXCEPT ![Head(<<>>)] = Cardinality({})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

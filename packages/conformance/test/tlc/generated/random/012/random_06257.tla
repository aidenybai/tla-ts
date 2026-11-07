(*---
description: Evaluates a random int expression, seed 262, number 6257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b9642 \in DOMAIN [b9643 \in Nat |-> b9643] |-> (([x \in 1..2 |-> x] @@ <<5, 6>>) * Head(<<>>))])[Cardinality(((SUBSET {1} \cap SUBSET {1}) \cap (1 .. 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

(*---
description: Evaluates a random record expression, seed 262, number 8684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({b13445 \in ({1, 2} \cap 1..3) : ({1, 2} = Nat)} \cap (LET b13446 == 7 IN 1 :> ({x \in 1..3 : x > 1} <=> TRUE))) EXCEPT !.a = @ + Cardinality((([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ ([x \in 1..2 |-> x] @@ (1 :> 2))))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08684 failed.
    Attempted to check equality of the set {1, 2} with the value:
    Nat
---*)

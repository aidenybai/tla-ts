(*---
description: Evaluates a random function expression, seed 262, number 5249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8125 \in (UNION {DOMAIN [x \in Nat |-> x + 1], DOMAIN (1 :> 2)} \cap ({-1, 2} \cup DOMAIN (1 :> 2))) |-> Cardinality({b8126 \in (1..3 \ 1..3) : ({2, 1, 3} = Nat)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05249 failed.
    Attempted to compare the set {1} with the value:
    Nat
---*)

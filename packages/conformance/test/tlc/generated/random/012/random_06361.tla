(*---
description: Evaluates a random set expression, seed 262, number 6361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b9779 \in {(-7) : b9780 \in UNION {Nat, {x \in 1..3 : x > 1}}} |-> {([a |-> 1, b |-> TRUE]).a : b9781 \in {<<>> : b9782 \in 1..3}}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06361 failed.
    Attempted to compare the set {2, 3} with the value:
    Nat
---*)

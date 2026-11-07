(*---
description: Evaluates a random set expression, seed 262, number 4555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b7139 \in {Head(<<3, 1, 2>>) : b7140 \in (SUBSET {1} \cap Nat)} |-> ([a |-> b7139, b |-> [a |-> 1]]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)

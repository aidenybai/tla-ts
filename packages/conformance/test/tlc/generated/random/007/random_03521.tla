(*---
description: Evaluates a random bool expression, seed 262, number 3521.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03521 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CHOOSE b5562 \in (Nat \cap SUBSET {1}) : (<<1, 2>> = [x \in 1..2 |-> x])), b |-> ((1 - 3) < (1 * 7))] \subseteq (((7 * 1) % Head(<<1, 2>>)) .. ((CHOOSE r \in [a : {}] : TRUE)).a)))
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

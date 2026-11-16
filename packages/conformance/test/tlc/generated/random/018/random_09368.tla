(*---
description: Evaluates a random bool expression, seed 262, number 9368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ([a |-> 0, b |-> TRUE] :> Cardinality(Nat)) = (Head(<<2147483647, 7>>) .. (CHOOSE b14541 \in (Nat \ Nat) : (~TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09368 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

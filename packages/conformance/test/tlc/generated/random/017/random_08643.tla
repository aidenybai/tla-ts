(*---
description: Evaluates a random bool expression, seed 262, number 8643.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08643 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13379 \in DOMAIN ((7 * 0) :> (~TRUE)) : (((b13379 - 1) .. ([x \in Nat |-> x + 1])[b13379]) \subseteq ((b13379 .. -1) \ (2..1 \ SUBSET {1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

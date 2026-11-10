(*---
description: Evaluates a random bool expression, seed 262, number 4373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((({x \in 1..3 : x > 1} \cap 1..3) = {b6891 \in {1} : FALSE}) /\ (Cardinality(Nat) < IF TRUE THEN -1 ELSE -1))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

(*---
description: Evaluates a random set expression, seed 262, number 3951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((2..1 \cup SUBSET {1})) .. ((-3) + ([a |-> 1]).a)) \ DOMAIN [[(1 :> 2) EXCEPT ![1] = 0] EXCEPT ![IF TRUE THEN 1 ELSE 1] = (1 - 1)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

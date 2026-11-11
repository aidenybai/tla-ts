(*---
description: Evaluates a random bool expression, seed 262, number 5438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality((0 .. 0)), (-([a |-> 1, b |-> TRUE]).a)} = {((-1 % 1) + {0, b8420}) : b8420 \in (DOMAIN (1 :> 2) \cap (Nat \ {2, 1, 3}))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

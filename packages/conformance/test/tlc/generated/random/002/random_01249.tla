(*---
description: Evaluates a random int expression, seed 262, number 1249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((({} \cup Nat) \cup (7 .. -1))) - CASE ((2 \in {}) \/ (<<>> = <<5, 6>>)) -> ((CHOOSE b1999 \in 2..1 : FALSE) * (-2)) [] OTHER -> IF (\E b2000 \in {x \in 1..3 : x > 1} : FALSE) THEN (2 % 0) ELSE (<<5, 6>>)[1]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01249 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

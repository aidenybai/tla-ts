(*---
description: Evaluates a random function expression, seed 262, number 100.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00100 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b153 \in {(CHOOSE b155 \in UNION {<<1>>, {x \in 1..3 : x > 1}} : (b154 = 1)) : b154 \in {b156 \in (1..3 \cup {}) : (<<3, 1, 2>> = [x \in 1..2 |-> x])}} |-> Cardinality((({} \cup {}) \cup ({1, 2} \cap 2..1)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

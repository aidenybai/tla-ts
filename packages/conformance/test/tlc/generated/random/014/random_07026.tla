(*---
description: Evaluates a random bool expression, seed 262, number 7026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2}] : TRUE) = [a |-> (CHOOSE b10777 \in ({x \in 1..3 : x > 1} \cup {1, 2}) : (TRUE \/ TRUE)), b |-> ({-1, 7} = {b10778 \in 2..1 : FALSE})]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

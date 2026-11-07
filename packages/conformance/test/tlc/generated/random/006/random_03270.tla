(*---
description: Evaluates a random function expression, seed 262, number 3270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((1..3 \cap 1..3)) - LET b5203 == (0 + 2) IN IF FALSE THEN 2 ELSE 2) :> CASE (\A b5204 \in {b5205 : b5205 \in 2..1} : (2 = 3)) -> (([a |-> 1, b |-> TRUE]).a % (-1 + 7)) [] OTHER -> IF (2 % 2) THEN (3 * 7) ELSE ([a |-> 1, b |-> TRUE]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)

(*---
description: Evaluates a random int expression, seed 262, number 6065.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9343 == (CHOOSE b9344 \in UNION {DOMAIN [x \in 1..2 |-> x], (0 .. 7)} : ((\E b9345 \in {x \in 1..3 : x > 1} : FALSE) \/ (TRUE \/ TRUE))) IN [Tail((<<3, 1, 2>> \o <<1, 2>>)) EXCEPT ![1] = Cardinality(UNION {2..1, 2..1})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 2, 1, 2>>"
---*)

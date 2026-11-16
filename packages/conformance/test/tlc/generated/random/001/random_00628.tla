(*---
description: Evaluates a random int expression, seed 262, number 628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b1050 == Cardinality({x \in 1..3 : x > 1}) IN LET b1051 == b1050 IN 2 % ([a |-> 7, b |-> TRUE]).a) % CASE ((FALSE <=> TRUE) /\ (~FALSE)) -> IF (\E b1052 \in {x \in 1..3 : x > 1} : FALSE) THEN (-0) ELSE Cardinality({1, 2}) [] OTHER -> (CHOOSE b1053 \in (2..1 \cup {1}) : (TRUE \/ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)

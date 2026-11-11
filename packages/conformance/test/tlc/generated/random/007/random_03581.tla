(*---
description: Evaluates a random function expression, seed 262, number 3581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b5647 \in ((CHOOSE b5648 \in SUBSET {1} : TRUE) \cup (3 .. 2)) |-> (CASE TRUE -> TRUE [] OTHER -> b5647 % Cardinality(1..3))] @@ (CHOOSE f \in [{} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

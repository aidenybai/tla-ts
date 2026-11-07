(*---
description: Evaluates a random bool expression, seed 262, number 6756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [b10356 \in 1..3 |-> b10356] = ((7 .. 3) \cup {<<3, 1, 2>> : b10357 \in SUBSET {1}})) => ([a |-> (-3), b |-> (FALSE = [x \in Nat |-> x + 1])] = [a |-> (CHOOSE b10358 \in 0 : FALSE), b |-> (\E b10359 \in {2, 1, 3} : <<1, 2>>)])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

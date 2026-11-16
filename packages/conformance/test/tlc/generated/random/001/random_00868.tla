(*---
description: Evaluates a random set expression, seed 262, number 868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b1405 \in {Cardinality({b1407 \in {} : TRUE}) : b1406 \in ({b1408 \in 2..1 : FALSE} \ {b1409 \in {1} : FALSE})} : (([[x \in 1..2 |-> x] EXCEPT ![b1405] = 0])[([a |-> 1, b |-> TRUE]).a] \in UNION {DOMAIN (1 :> 2), {b1410 \in Nat : TRUE}})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

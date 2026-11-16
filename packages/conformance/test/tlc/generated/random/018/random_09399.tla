(*---
description: Evaluates a random function expression, seed 262, number 9399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14583 \in (DOMAIN (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) \cup DOMAIN [b14584 \in 2..1 |-> 3]) |-> ([a |-> (b14583 .. b14583), b |-> (FALSE /\ FALSE)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1..1, 2..2>>"
---*)

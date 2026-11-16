(*---
description: Evaluates a random bool expression, seed 262, number 8473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [a |-> Cardinality({b13112 \in {2, 1, 3} : FALSE}), b |-> ((TRUE /\ TRUE) /\ (~FALSE))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

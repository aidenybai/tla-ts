(*---
description: Evaluates a random bool expression, seed 262, number 5653.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05653 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b8730 \in SUBSET {1} : FALSE} \subseteq (1..3 \ Nat)) => (([a |-> 1]).a \in DOMAIN <<5, 6>>)) \/ (IF (0 = [x \in 1..2 |-> x]) THEN SelectSeq(-1, LAMBDA e : e > 0) ELSE ([a |-> 1]).a \in {IF TRUE THEN 7 ELSE 7, ([a |-> 1, b |-> TRUE]).a})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

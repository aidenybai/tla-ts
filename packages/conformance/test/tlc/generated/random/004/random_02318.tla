(*---
description: Evaluates a random set expression, seed 262, number 2318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3668 \in {([a |-> b3669, b |-> FALSE]).a : b3669 \in {IF TRUE THEN b3670 ELSE 1 : b3670 \in {b3671 \in {1, 2} : TRUE}}} : (((TRUE => TRUE) \/ (~FALSE)) /\ (~(b3668 = 0)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)

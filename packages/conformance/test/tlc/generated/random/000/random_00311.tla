(*---
description: Evaluates a random bool expression, seed 262, number 311.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00311 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((TRUE => TRUE) => (3 < 3)) /\ (([a |-> 1] /\ FALSE) => (2147483647 < 1..3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

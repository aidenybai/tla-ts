(*---
description: Evaluates a random bool expression, seed 262, number 987.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00987 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\E b1583 \in (1..3 \ Nat) : (3 \in {1}))) \/ (\E b1584 \in {(2 + 3), (2 - 1)} : ((b1584 < b1584) \/ (FALSE => TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

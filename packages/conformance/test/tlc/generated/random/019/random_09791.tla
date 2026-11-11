(*---
description: Evaluates a random bool expression, seed 262, number 9791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<>>) = (-1)) <=> (~(7 < 3))) <=> (~((1 = 3) <=> (TRUE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

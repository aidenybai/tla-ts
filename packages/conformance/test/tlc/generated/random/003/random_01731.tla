(*---
description: Evaluates a random bool expression, seed 262, number 1731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((~TRUE) => (FALSE /\ FALSE)) <=> ({b2753 \in {1, 2} : FALSE} \subseteq (0 .. -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 6538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\A b10051 \in DOMAIN <<5, 6>> : (FALSE /\ FALSE)) /\ (({1} \ {1, 2}) \subseteq (Nat \cup {1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

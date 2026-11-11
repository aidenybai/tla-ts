(*---
description: Evaluates a random bool expression, seed 262, number 4511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(\A b7086 \in {2, 1, 3} : TRUE)) <=> (CASE FALSE -> -1 [] OTHER -> 7 < Cardinality({1}))) \/ (~((~TRUE) <=> (\A b7087 \in {2, 1, 3} : FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

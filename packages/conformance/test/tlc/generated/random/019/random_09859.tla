(*---
description: Evaluates a random set expression, seed 262, number 9859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (Cardinality(DOMAIN (1 :> 2)) :> (-LET b15311 == 2147483647 IN 2147483647)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)

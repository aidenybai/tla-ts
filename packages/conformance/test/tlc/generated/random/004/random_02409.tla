(*---
description: Evaluates a random bool expression, seed 262, number 2409.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02409 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN (0 :> 7)) < Len(<<LET b3810 == 7 IN b3810, Len(<<1, 2>>)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

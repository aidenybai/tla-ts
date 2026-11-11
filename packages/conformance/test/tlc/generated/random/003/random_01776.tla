(*---
description: Evaluates a random set expression, seed 262, number 1776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE f \in [{} -> {1, 2}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)

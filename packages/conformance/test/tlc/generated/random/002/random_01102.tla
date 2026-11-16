(*---
description: Evaluates a random bool expression, seed 262, number 1102.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((~(~FALSE)) /\ ((0 .. 2) = Append(<<1>>, 7)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

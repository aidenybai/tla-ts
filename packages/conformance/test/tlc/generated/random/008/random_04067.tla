(*---
description: Evaluates a random bool expression, seed 262, number 4067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Append([<<1, 2>> EXCEPT ![1] = 7], (CHOOSE b6404 \in 1..3 : TRUE)) = (Len(<<>>) :> ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

(*---
description: Evaluates a random function expression, seed 262, number 9081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> ([a |-> 1]).a, b |-> (~TRUE)]).a :> (-Cardinality(DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-2>>"
---*)

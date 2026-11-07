(*---
description: Evaluates a random set expression, seed 262, number 4597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = @ + (-2)]).a .. Cardinality(DOMAIN ((1 :> 2) @@ <<5, 6>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..2"
---*)

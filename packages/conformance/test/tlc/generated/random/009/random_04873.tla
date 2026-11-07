(*---
description: Evaluates a random seq expression, seed 262, number 4873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (-(<<5, 6>>)[2])], [b7592 \in {Cardinality(SUBSET {1}) : b7593 \in {3, 3}} |-> Cardinality(DOMAIN [x \in 1..2 |-> x])]>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<[a |-> -5], (2 :> 2)>>"
---*)

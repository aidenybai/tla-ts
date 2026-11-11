(*---
description: Evaluates a random bool expression, seed 262, number 6117.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06117 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b9413 \in Len(<<1>>) : (2..1 = {1, 2})} \cap ({b9414 \in {} : TRUE} \cup {b9415 \in 1..3 : FALSE})) = {Cardinality(({1, 2} \ {})) : b9416 \in DOMAIN ([x \in 1..2 |-> x] @@ <<3, 1, 2>>)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

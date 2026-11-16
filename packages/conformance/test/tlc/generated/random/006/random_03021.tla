(*---
description: Evaluates a random set expression, seed 262, number 3021.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Cardinality(SUBSET {1}) * (<<5, 6>>)[1]) : b4805 \in ({0, 0} \ {1, 0})} \cup ({b4806 \in (0 .. 1) : (TRUE /\ TRUE)} \ DOMAIN (<<5, 6>> @@ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0}"
---*)

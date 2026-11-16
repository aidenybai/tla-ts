(*---
description: Evaluates a random record expression, seed 262, number 2813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b4466 \in ({2, 1, 3} \cup 2..1) : (~FALSE)} \ ((2 .. 2) \cup (2..1 \ {1}))), (({b4467 : b4467 \in {1, 2}} \ UNION {1..3, {x \in 1..3 : x > 1}}) \ ((-1 .. -1) \ ({1} \cap {})))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 3}"
---*)

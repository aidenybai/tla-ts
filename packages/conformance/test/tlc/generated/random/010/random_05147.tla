(*---
description: Evaluates a random bool expression, seed 262, number 5147.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05147 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~({[[a |-> 1] EXCEPT !.a = @ + b7992] : b7992 \in ({1} \cap {})} = (({1} \cap {2, 1, 3}) \cap {b7993 : b7993 \in {x \in 1..3 : x > 1}}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

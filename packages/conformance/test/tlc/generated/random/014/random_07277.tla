(*---
description: Evaluates a random record expression, seed 262, number 7277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = Cardinality(UNION {{b11205 \in 2..1 : TRUE}, {b11206 \in SUBSET {1} : FALSE}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)

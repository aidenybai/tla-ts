(*---
description: Evaluates a random bool expression, seed 262, number 8391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((\E b12981 \in {b12982 \in 1..3 : FALSE} : LET b12983 == b12981 IN -1) <=> (\E b12984 \in DOMAIN <<5, 6>> : (FALSE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

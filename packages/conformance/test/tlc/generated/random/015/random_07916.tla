(*---
description: Evaluates a random int expression, seed 262, number 7916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o [<<1, 2>> EXCEPT ![1] = 7])) % (IF (7 = 1) THEN (7 - 3) ELSE (3 + 7) % LET b12215 == (2 - 7) IN LET b12216 == b12215 IN 7)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)

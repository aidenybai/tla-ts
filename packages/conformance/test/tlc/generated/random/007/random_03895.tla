(*---
description: Evaluates a random int expression, seed 262, number 3895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) \o (IF FALSE THEN 2 ELSE 3 \div Cardinality(2..1))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)

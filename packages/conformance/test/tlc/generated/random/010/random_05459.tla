(*---
description: Evaluates a random bool expression, seed 262, number 5459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) = (CHOOSE r \in [a : {1}] : TRUE)) <=> (~((TRUE \/ TRUE) => ({x \in 1..3 : x > 1} = {})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

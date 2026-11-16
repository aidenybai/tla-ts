(*---
description: Evaluates a random bool expression, seed 262, number 6391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Len(Tail(<<1, 2>>))) \in ((({1, 2} \cap 2..1) \cap UNION {{}, 1..3}) \cup UNION {UNION {{}, {}}, (0 .. 1)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

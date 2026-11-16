(*---
description: Evaluates a random bool expression, seed 262, number 3417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1} \cup {1}) = {3, 2147483647}) => (((1 :> 2))[3] = Len(<<>>))) \/ (((-1 .. 7) = {b5424 : b5424 \in {2, 1, 3}}) <=> ((2..1 \cup {1}) = DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

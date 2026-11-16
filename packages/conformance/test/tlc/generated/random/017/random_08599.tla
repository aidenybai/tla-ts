(*---
description: Evaluates a random set expression, seed 262, number 8599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) : b13321 \in DOMAIN [b13322 \in 1..3 |-> b13322]} \ (((7 - 2) - (2 % 2147483647)) .. Len(<<0, 7>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)

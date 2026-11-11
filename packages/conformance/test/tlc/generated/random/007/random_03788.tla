(*---
description: Evaluates a random set expression, seed 262, number 3788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SortSeq((<<>> \o <<1>>), LAMBDA p, q : p < q)) : b5976 \in DOMAIN ((-7) :> (1 - 1))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)

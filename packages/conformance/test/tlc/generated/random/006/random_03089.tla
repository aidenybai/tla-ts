(*---
description: Evaluates a random record expression, seed 262, number 3089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4919 \in {Head(SubSeq(<<3, 1, 2>>, <<3, 1, 2>>, b4920)) : b4920 \in ((<<5, 6>>)[1] .. ([a |-> 1]).a)} |-> Cardinality((Len(<<1>>) .. (<<1, 2>>)[7]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 9327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<1, 2>>) .. Len(<<>>)) = {Cardinality(2..1) : b14467 \in (-1 .. 2)}) /\ [b14468 \in UNION {(2..1 \cap SUBSET {1}), {7 : b14469 \in {}}} |-> ((FALSE /\ FALSE) + (-b14468))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

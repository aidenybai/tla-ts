(*---
description: Evaluates a random bool expression, seed 262, number 4444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(-0), (2 \div 3)} \ DOMAIN [b6992 \in Nat |-> 2]) = (LET b6993 == Head(<<3, 1, 2>>) IN (-b6993) .. Head(<<0, 3>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

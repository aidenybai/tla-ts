(*---
description: Evaluates a random set expression, seed 262, number 4804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(Append(Append(<<>>, 1), (3 % 2)), ((CHOOSE r \in [a : 1..2] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)

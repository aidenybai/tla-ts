(*---
description: Evaluates a random function expression, seed 262, number 1982.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01982 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b3142 \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![0] = -1] |-> Cardinality(DOMAIN <<5, 6>>)] EXCEPT ![Cardinality({(0 + 2147483647), Len(<<3, 1, 2>>)})] = Len(Tail(Append(<<>>, 7)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b3142 \\in Nat |-> <expression line 14, col 80 to line 14, col 107 of module random_01982>]"
---*)

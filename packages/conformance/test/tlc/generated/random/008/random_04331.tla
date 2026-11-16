(*---
description: Evaluates a random record expression, seed 262, number 4331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b6821 == IF FALSE THEN 0 ELSE 0 IN (-1 % 1), b |-> (~(\E b6822 \in {} : FALSE))] EXCEPT !.a = Cardinality((({1, 2} \ Nat) \cup ({1} \ {1, 2})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> TRUE]"
---*)

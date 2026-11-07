(*---
description: Evaluates a random record expression, seed 262, number 8742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(Tail(Append(<<>>, 3))), b |-> (IF (TRUE /\ TRUE) THEN ([a |-> 1, b |-> TRUE]).a ELSE Head(<<>>) = ([a |-> 1, b |-> FALSE]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> 1]"
---*)

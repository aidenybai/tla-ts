(*---
description: Evaluates a random record expression, seed 262, number 4638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 0, b |-> FALSE] EXCEPT !.a = CASE FALSE -> 3 [] OTHER -> 0] EXCEPT !.a = (-([a |-> 1]).a)] EXCEPT !.a = (IF (TRUE \/ [a |-> 1, b |-> TRUE]) THEN Cardinality({2, 1, 3}) ELSE (<<5, 6>>)[2] - ([b7268 \in {1, 2} |-> 1])[(-1 :> -1)])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 3, b |-> FALSE]"
---*)

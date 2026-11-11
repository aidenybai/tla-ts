(*---
description: Evaluates a random seq expression, seed 262, number 8486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail(<<-1, 1>>), LAMBDA e : e > 0) \o ([[b13135 \in {1, 2} |-> b13135] EXCEPT ![Cardinality(SUBSET {1})] = IF FALSE THEN 7 ELSE 7] @@ (Cardinality({2, 1, 3}) :> (-7)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 7, -7>>"
---*)

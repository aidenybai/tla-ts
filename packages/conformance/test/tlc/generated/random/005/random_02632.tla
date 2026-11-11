(*---
description: Evaluates a random record expression, seed 262, number 2632.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02632 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b4150 \in {-1 : b4151 \in 1..3} : (~FALSE)), b |-> ((\E b4152 \in SUBSET {1} : TRUE) /\ (TRUE /\ TRUE))] EXCEPT !.a = @ + ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = Cardinality(SUBSET {1})]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)

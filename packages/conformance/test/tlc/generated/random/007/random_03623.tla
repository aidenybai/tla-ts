(*---
description: Evaluates a random bool expression, seed 262, number 3623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 1, b |-> [a |-> 1]] = [[a |-> 1] EXCEPT !.a = {2, 1, 3}]) \/ ((\A b5720 \in SUBSET {1} : FALSE) => ({2, 1, 3} = <<>>))) <=> (\A b5721 \in {b5722 \in {b5723 \in 2..1 : TRUE} : (CHOOSE b5724 \in 1..3 : FALSE)} : (\A b5725 \in (Nat \ Nat) : (TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

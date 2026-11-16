(*---
description: Evaluates a random record expression, seed 262, number 5768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (-1 + -1), b |-> (<<1>> = [x \in 1..2 |-> x])] EXCEPT !.a = @ + IF (<<>> = [x \in 1..2 |-> x]) THEN CASE TRUE -> 2147483647 [] OTHER -> 0 ELSE LET b8885 == -1 IN 3] EXCEPT !.a = @ + LET b8886 == Cardinality({b8887 \in Nat : FALSE}) IN (CHOOSE b8888 \in UNION {1..3, {}} : (b8888 \in Nat))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> FALSE]"
---*)

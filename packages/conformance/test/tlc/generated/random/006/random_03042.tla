(*---
description: Evaluates a random record expression, seed 262, number 3042.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 7, b |-> FALSE] EXCEPT !.a = IF TRUE THEN 2 ELSE 0] EXCEPT !.a = @ + LET b4837 == IF TRUE THEN 3 ELSE 7 IN (b4837 + b4837)] EXCEPT !.a = Cardinality({(b4838 * <<5, 6>>) : b4838 \in {b4839 \in {1} : FALSE}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> FALSE]"
---*)

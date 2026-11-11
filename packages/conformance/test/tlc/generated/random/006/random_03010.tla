(*---
description: Evaluates a random seq expression, seed 262, number 3010.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03010 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4783 \in {b4784 \in ({b4785 \in {1} : FALSE} \ ({2, 1, 3} \cup {})) : ((TRUE <=> TRUE) \/ (FALSE => TRUE))} |-> Head(<<(b4783 % 0), Head(<<1, 2>>)>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

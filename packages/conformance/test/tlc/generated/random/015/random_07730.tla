(*---
description: Evaluates a random set expression, seed 262, number 7730.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07730 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({(3 % 2), (2 % 3)} \cap {([a |-> 1, b |-> TRUE]).a : b11921 \in ({x \in 1..3 : x > 1} \cup {})}), {([[a |-> 1] EXCEPT !.a = @ + 2]).a, (CHOOSE b11922 \in {b11923 \in {1, 2} : TRUE} : (TRUE \/ TRUE))}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 3}"
---*)

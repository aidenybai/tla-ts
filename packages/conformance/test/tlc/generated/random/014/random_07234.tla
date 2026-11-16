(*---
description: Evaluates a random function expression, seed 262, number 7234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) @@ (CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE)) @@ [b11110 \in (([a |-> 1, b |-> TRUE]).a .. (2147483647 % 2)) |-> LET b11111 == LET b11112 == b11110 IN 3 IN (b11111 \div b11110)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 1>>"
---*)

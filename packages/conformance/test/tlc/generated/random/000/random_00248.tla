(*---
description: Evaluates a random function expression, seed 262, number 248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b408 \in UNION {{[b410 \in {x \in 1..3 : x > 1} |-> b409] : b409 \in (0 .. -1)}, ({b411 \in {1} : FALSE} \cap {3, 2147483647})} |-> (CHOOSE r \in [a : {1, 2}] : TRUE)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)

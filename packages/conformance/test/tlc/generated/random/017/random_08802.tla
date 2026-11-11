(*---
description: Evaluates a random bool expression, seed 262, number 8802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = IF ({x \in 1..3 : x > 1} = {1, 2}) THEN ([a |-> 1, b |-> TRUE]).a ELSE (2147483647 - 1)] = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

(*---
description: Evaluates a random record expression, seed 262, number 3706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (0 \div 2)] EXCEPT !.a = ((0 \div 0) * (1 - 0))] EXCEPT !.a = @ + CASE (({1} \subseteq {1}) => (TRUE => TRUE)) -> (-IF FALSE THEN 0 ELSE 1) [] OTHER -> ([a |-> 0, b |-> FALSE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)

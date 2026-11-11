(*---
description: Evaluates a random record expression, seed 262, number 8249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = (CHOOSE b12764 \in {3, 2147483647} : (FALSE => TRUE))] EXCEPT !.a = IF ((7 \in {1, 2}) /\ SubSeq(<<>>, 7, 7)) THEN Tail(<<1, 1>>) ELSE IF (\E b12765 \in {2, 1, 3} : FALSE) THEN (3 % 2) ELSE (-1 + 7)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 6]"
---*)

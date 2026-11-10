(*---
description: Evaluates a random seq expression, seed 262, number 3669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((TRUE \/ FALSE) /\ (FALSE => TRUE)) -> IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN [[a |-> 1] EXCEPT !.a = -1] ELSE Len(<<3, 1, 2>>) [] OTHER -> IF (3 = 2147483647) THEN Cardinality({2, 1, 3}) ELSE ([a |-> 1, b |-> TRUE]).a, Head(Tail(Tail(<<3, 1, 2>>)))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 2>>"
---*)

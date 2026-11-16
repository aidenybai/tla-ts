(*---
description: Evaluates a random record expression, seed 262, number 9936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + IF ((TRUE /\ FALSE) /\ (~TRUE)) THEN LET b15457 == (CHOOSE b15458 \in {1} : TRUE) IN (7 + b15457) ELSE ([b15459 \in Nat |-> b15459])[Head(<<1, 2>>)]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)

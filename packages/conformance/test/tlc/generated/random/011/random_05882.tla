(*---
description: Evaluates a random record expression, seed 262, number 5882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = ((0 :> 1))[Cardinality(2..1)]] EXCEPT !.a = IF ((TRUE /\ TRUE) => (FALSE /\ TRUE)) THEN (-CASE FALSE -> (1 :> 2) [] OTHER -> 2) ELSE Cardinality((2147483647 .. 3))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)

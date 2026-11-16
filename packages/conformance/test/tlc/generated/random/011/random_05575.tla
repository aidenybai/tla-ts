(*---
description: Evaluates a random record expression, seed 262, number 5575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = ((((1 :> 2) @@ [x \in 1..2 |-> x]))[(2 * 1)] % (CASE TRUE -> 7 [] OTHER -> -1 - IF FALSE THEN 7 ELSE 0))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)

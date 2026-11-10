(*---
description: Evaluates a random bool expression, seed 262, number 7516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]) \/ (CASE FALSE -> 3 [] OTHER -> 7 = Cardinality({}))) <=> (\E b11577 \in (({x \in 1..3 : x > 1} \cap {2, 1, 3}) \cup {b11578 \in SUBSET {1} : FALSE}) : ((\E b11579 \in 1..3 : FALSE) => (~FALSE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

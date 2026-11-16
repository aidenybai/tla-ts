(*---
description: Evaluates a random bool expression, seed 262, number 1502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b2394 == ([[a |-> 1] EXCEPT !.a = @ + -1]).a IN CASE (FALSE => TRUE) -> (7 = b2394) [] OTHER -> ((1 :> 2))[2] \in UNION {{LET b2395 == 3 IN 3, (-2)}, [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + (2 % 0)]}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

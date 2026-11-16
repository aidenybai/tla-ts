(*---
description: Evaluates a random bool expression, seed 262, number 7699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> -1, b |-> FALSE] EXCEPT !.a = @ + Len(<<1, 2>>)]).a < (CHOOSE b11863 \in {Len(<<>>) : b11864 \in ({2, 1, 3} \cup {x \in 1..3 : x > 1})} : ((1..3 \subseteq {}) => (TRUE => TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

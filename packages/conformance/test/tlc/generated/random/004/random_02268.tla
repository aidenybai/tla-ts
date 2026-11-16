(*---
description: Evaluates a random bool expression, seed 262, number 2268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b3573 \in {1, 2} : FALSE} \cup {b3574 \in 2..1 : TRUE}) \subseteq {Head(<<1>>) : b3575 \in {b3576 : b3576 \in {1, 2}}}) => ([[a |-> 3, b |-> TRUE] EXCEPT !.a = @ + (CHOOSE b3577 \in 1..3 : TRUE)] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

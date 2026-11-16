(*---
description: Evaluates a random bool expression, seed 262, number 8681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] = (CHOOSE r \in [a : 1..2] : TRUE)) <=> ((<<3, 1, 2>> = [a |-> 1]) => (FALSE => FALSE))) <=> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = (2147483647 % 1)] = [a |-> LET b13442 == -1 IN b13442, b |-> (<<1>> = (1 :> 2))])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

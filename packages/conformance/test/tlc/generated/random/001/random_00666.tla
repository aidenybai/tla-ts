(*---
description: Evaluates a random int expression, seed 262, number 666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([a |-> (-0), b |-> (TRUE => TRUE)] = [[a |-> <<1, 2>>, b |-> TRUE] EXCEPT !.a = Len(<<>>)]) -> ((LET b1108 == -1 IN b1108 \div (-1 % 7)) + Len(Tail(<<1, 2>>))) [] OTHER -> (((7 % -1) * (2 :> 7)) \div LET b1109 == Len(<<>>) IN (CHOOSE b1110 \in {} : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)

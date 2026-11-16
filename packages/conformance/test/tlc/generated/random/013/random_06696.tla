(*---
description: Evaluates a random int expression, seed 262, number 6696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (Tail(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) = ((7 % 1) :> ([a |-> 1]).a)) THEN Len([<<0, -1>> EXCEPT ![1] = (-2147483647)]) ELSE ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Head(<<3, 1, 2>>)]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 4"
---*)

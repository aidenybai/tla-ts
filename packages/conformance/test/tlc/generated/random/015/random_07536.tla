(*---
description: Evaluates a random bool expression, seed 262, number 7536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(LET b11616 == 7 IN b11616 = Head(<<1>>))) \/ ([a |-> CASE FALSE -> 7 [] OTHER -> 0, b |-> (TRUE /\ TRUE)] = [[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = @ + (3 % 3)])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)

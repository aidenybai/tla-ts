(*---
description: Evaluates a random bool expression, seed 262, number 6164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 0, b |-> <<5, 6>>] EXCEPT !.a = CASE FALSE -> 1 [] OTHER -> -1] EXCEPT !.a = @ + Head(Append(<<3, 1, 2>>, 1))] = [a |-> Len(Tail(<<1, 2>>)), b |-> ((\E b9482 \in {} : FALSE) \/ (7 < 1))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

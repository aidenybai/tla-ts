(*---
description: Evaluates a random int expression, seed 262, number 5500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(Tail((Nat \o <<1>>)), LAMBDA e : e > 0), IF ((0 \in -1) /\ (~FALSE)) THEN Head(SelectSeq(<<>>, LAMBDA e : e > 0)) ELSE ((3 * 0) * (0 % 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Nat
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Nat
---*)

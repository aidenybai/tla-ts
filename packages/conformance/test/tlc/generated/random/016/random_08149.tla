(*---
description: Evaluates a random function expression, seed 262, number 8149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<(Len(<<1>>) % Head(<<1, 2>>)), (CHOOSE b12602 \in (2..1 \cup {1, 2}) : (b12602 < 3))>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)

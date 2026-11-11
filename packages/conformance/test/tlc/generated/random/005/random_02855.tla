(*---
description: Evaluates a random seq expression, seed 262, number 2855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((SelectSeq(Append(<<1>>, 7), LAMBDA e : e > 0) \o [[<<1, 2>> EXCEPT ![1] = 2] EXCEPT ![1] = (CHOOSE b4527 \in {x \in 1..3 : x > 1} : TRUE)]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 7, 2, 2>>"
---*)

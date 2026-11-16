(*---
description: Evaluates a random seq expression, seed 262, number 4346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([Append((<<1>> \o <<1, 2>>), IF FALSE THEN 2 ELSE 1) EXCEPT ![1] = (CHOOSE b6850 \in {0, 0} : (TRUE \/ TRUE))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 1>>"
---*)

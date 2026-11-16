(*---
description: Evaluates a random int expression, seed 262, number 2784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\A b4399 \in {7 : b4400 \in 2..1} : (<<1>> = [x \in 1..2 |-> x])) -> Head(Append(<<>>, 2147483647)) [] OTHER -> (-LET b4401 == 2147483647 IN 2..1) \div Head((CHOOSE b4402 \in {3 : b4403 \in {1}} : (2147483647 = -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2147483647"
---*)

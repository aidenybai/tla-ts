(*---
description: Evaluates a random bool expression, seed 262, number 1214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((Append(<<>>, 2147483647) \o Append(<<3, 1, 2>>, 0))) /\ (((1 % 1) = (CHOOSE b1949 \in {x \in 1..3 : x > 1} : FALSE)) => ((2..1 \ {2, 1, 3}) \subseteq DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01214 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    an integer.
    line 14, col 17 to line 14, col 188 of module random_01214
---*)

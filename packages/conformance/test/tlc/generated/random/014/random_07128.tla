(*---
description: Evaluates a random function expression, seed 262, number 7128.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07128 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((-3) .. (-1 - 2147483647))) :> IF (([a |-> 1]).a < LET b10943 == 3 IN b10943) THEN CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Len(<<1>>) [] OTHER -> LET b10944 == 2147483647 IN b10944 ELSE ([b10945 \in {1, 2} |-> b10945])[(CHOOSE b10946 \in {2, 1, 3} : TRUE)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 2147483647)"
---*)

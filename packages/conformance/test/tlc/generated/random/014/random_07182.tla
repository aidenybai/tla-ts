(*---
description: Evaluates a random bool expression, seed 262, number 7182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11033 \in {IF (\A b11035 \in {1} : TRUE) THEN LET b11036 == {1} IN 2 ELSE (-1 < b11034) : b11034 \in ({b11037 : b11037 \in 2..1} \ ({2, 1, 3} \cap {x \in 1..3 : x > 1}))} : ([a |-> (2 % 1), b |-> (1 = <<1, 2>>)] = [[[a |-> 1] EXCEPT !.a = b11033] EXCEPT !.a = @ + CASE TRUE -> FALSE [] OTHER -> b11033])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)

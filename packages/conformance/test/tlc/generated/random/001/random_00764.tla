(*---
description: Evaluates a random bool expression, seed 262, number 764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\E b1251 \in {7, 3} : (FALSE => TRUE)) THEN (-CASE TRUE -> -1 [] OTHER -> 2147483647) ELSE CASE (FALSE <=> TRUE) -> CASE TRUE -> -1 [] OTHER -> 3 [] OTHER -> ([a |-> 1, b |-> TRUE]).a .. (((<<3, 1, 2>> = <<5, 6>>) /\ (\A b1252 \in 2..1 : [a |-> 1]))).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)

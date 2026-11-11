(*---
description: Evaluates a random bool expression, seed 262, number 8501.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08501 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b13165 \in {1, 2} : TRUE} = {b13166 : b13166 \in {}}) /\ (Head([a |-> 1]) < (-7))) \/ (CASE (~FALSE) -> IF TRUE THEN 2147483647 ELSE 2 [] OTHER -> ([a |-> 1] = [a |-> 1]) < ([a |-> 1, b |-> 1..3]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08501 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    an integer.
    line 14, col 17 to line 14, col 218 of module random_08501
---*)

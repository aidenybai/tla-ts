(*---
description: Evaluates a random bool expression, seed 262, number 1664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((FALSE => FALSE) /\ [b2652 \in 7 |-> b2652]) THEN (-CASE FALSE -> -1 [] OTHER -> 0) ELSE (CHOOSE r \in [a : 2..1] : TRUE) < ((([a |-> 1] * 3) \div LET b2653 == 0 IN 7) % {(b2654 * 1) : b2654 \in (CHOOSE b2655 \in Nat : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01664 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function of the form  [x \in S |-> expr].
    line 14, col 21 to line 14, col 63 of module random_01664
---*)

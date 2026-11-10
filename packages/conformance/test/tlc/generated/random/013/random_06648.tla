(*---
description: Evaluates a random int expression, seed 262, number 6648.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06648 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b10201 == ([<<>> EXCEPT !.a = @ + 0]).a IN CASE (TRUE /\ [x \in Nat |-> x + 1]) -> Len(<<5, 6>>) [] OTHER -> (-3) + (((2147483647 * 3) :> Len(<<1, 2>>)))[((CHOOSE b10202 \in Nat : FALSE) \div Len(<<1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06648 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function of the form  [x \in S |-> expr].
    line 14, col 70 to line 14, col 98 of module random_06648
---*)

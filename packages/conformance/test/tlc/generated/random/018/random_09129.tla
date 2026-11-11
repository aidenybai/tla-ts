(*---
description: Evaluates a random bool expression, seed 262, number 9129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[CASE (TRUE <=> [x \in 1..2 |-> x]) -> (CHOOSE b14177 \in <<>> : <<1, 2>>) [] OTHER -> (7 + -1) EXCEPT !.a = @ + (CHOOSE b14178 \in (2..1 \cup 2..1) : (<<1>> = b14178))] EXCEPT !.a = @ + Len([([a |-> 1] \o <<1, 2>>) EXCEPT ![1] = CASE FALSE -> 0 [] OTHER -> 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09129 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 24 to line 14, col 50 of module random_09129
---*)

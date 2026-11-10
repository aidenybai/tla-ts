(*---
description: Evaluates a random record expression, seed 262, number 8827.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08827 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(1 :> 2147483647) EXCEPT ![(Nat).a] = (1 % 7)] EXCEPT ![Cardinality(UNION {{1}, 1..3})] = (CHOOSE b13667 \in {b13668 \in {1} : TRUE} : (\E b13669 \in {1, 2} : TRUE))] EXCEPT !.a = @ + Head(Tail([<<>> EXCEPT ![1] = -1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08827 failed.
    Attempted to select field "a" from a non-record value Nat
    line 14, col 46 to line 14, col 52 of module random_08827
---*)

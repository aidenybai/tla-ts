(*---
description: Evaluates a random record expression, seed 262, number 5178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF FALSE THEN 2 ELSE 1 % (CHOOSE b8033 \in {1, 2} : FALSE)), b |-> (Tail(<<>>) = [[x \in 1..2 |-> x] EXCEPT ![2] = 0])] EXCEPT !.a = @ + (CHOOSE b8034 \in (Cardinality(Nat) .. (CHOOSE b8035 \in {2, 1, 3} : TRUE)) : ([[a |-> 1] EXCEPT !.a = @ + -1] = [a |-> b8034, b |-> FALSE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05178 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 51 to line 14, col 81 of module random_05178
---*)

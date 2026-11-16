(*---
description: Evaluates a random record expression, seed 262, number 2423.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02423 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> IF <<5, 6>> THEN -1 ELSE 2, b |-> (7 :> -1)] EXCEPT !.a = ((0 % (1 :> 2)) \div Cardinality({1}))] EXCEPT !.a = @ + (CHOOSE b3826 \in {(b3827 * b3827) : b3827 \in {b3828 \in Nat : FALSE}} : (Tail(<<1>>) = [<<5, 6>> EXCEPT ![2147483647] = -1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02423 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 25 to line 14, col 50 of module random_02423
---*)

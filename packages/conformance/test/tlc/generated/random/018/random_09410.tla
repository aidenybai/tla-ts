(*---
description: Evaluates a random int expression, seed 262, number 9410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((-7) < Len(<<3, 1, 2>>)) THEN (CHOOSE b14596 \in {<<1, 2>>, [x \in Nat |-> x + 1]} : ({} \subseteq Nat)) ELSE ((1 * 1) * CASE TRUE -> 1 [] OTHER -> -1) % IF ((<<3, 1, 2>> \o <<1, 2>>) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = [x \in Nat |-> x + 1]]) THEN CASE (2 = 3) -> CASE TRUE -> 1 [] OTHER -> 3 [] OTHER -> (-1 % 7) ELSE (Len(<<>>) \div IF FALSE THEN -1 ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09410 failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)

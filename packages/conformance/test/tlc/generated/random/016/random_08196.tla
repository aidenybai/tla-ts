(*---
description: Evaluates a random int expression, seed 262, number 8196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((((1 :> 2) = [x \in 1..2 |-> x]) /\ (\E b12675 \in Nat : TRUE)) /\ (Head(<<3, 1, 2>>) = ([a |-> 1]).a)) -> {b12676 \in {b12677 \in ([x \in Nat |-> x + 1] \cap {1}) : (\E b12678 \in SUBSET {1} : TRUE)} : ((3 .. -1) \subseteq ({1, 2} \cup SUBSET {1}))} [] OTHER -> IF (IF FALSE THEN 0 ELSE {2, 1, 3} < Len(<<>>)) THEN (CASE TRUE -> -1 [] OTHER -> 0 * (2147483647 + 0)) ELSE (CHOOSE b12679 \in (1 :> -1) : (TRUE <=> FALSE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08196 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    {1, 2, 3}
---*)

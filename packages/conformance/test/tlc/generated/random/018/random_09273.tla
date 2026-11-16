(*---
description: Evaluates a random function expression, seed 262, number 9273.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09273 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ({b14396 \in {2, 1, 3} : TRUE} = {b14397 \in {1, 2} : <<3, 1, 2>>}) THEN (Len(<<>>) * CASE TRUE -> 2 [] OTHER -> 3) ELSE Head(DOMAIN <<5, 6>>) :> CASE (({2, 1, 3} \cap SUBSET {1}) \subseteq UNION {2..1, SUBSET {1}}) -> LET b14398 == (-2) IN IF FALSE THEN b14398 ELSE <<1, 2>> [] OTHER -> ((0 - 0) % ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09273 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 74 to line 14, col 84 of module random_09273
---*)

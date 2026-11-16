(*---
description: Evaluates a random bool expression, seed 262, number 2499.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02499 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = CASE <<5, 6>> -> 3 [] OTHER -> 1] EXCEPT !.a = @ + CASE (TRUE \/ TRUE) -> IF FALSE THEN 7 ELSE 2 [] OTHER -> (CHOOSE b3935 \in {1} : FALSE)] EXCEPT !.a = ((Head(<<1>>) % ([a |-> 1, b |-> TRUE]).a) % IF (1..3 \subseteq {1}) THEN (2 % -1) ELSE IF FALSE THEN 3 ELSE 1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02499 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 78 to line 14, col 85 of module random_02499
---*)

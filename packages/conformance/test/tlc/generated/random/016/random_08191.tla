(*---
description: Evaluates a random function expression, seed 262, number 8191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b12665 \in DOMAIN (1 :> 2) : (~TRUE)} @@ ((-3) :> CASE <<3, 1, 2>> -> 0 [] OTHER -> 7)) @@ ((([a |-> 1, b |-> TRUE]).a % Len(<<1, 2>>)) :> ((CHOOSE b12666 \in {1} : FALSE) + IF TRUE THEN 0 ELSE 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08191 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 74 to line 14, col 84 of module random_08191
---*)

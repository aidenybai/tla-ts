(*---
description: Evaluates a random record expression, seed 262, number 5972.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05972 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ((1..3).a \div CASE FALSE -> 2147483647 [] OTHER -> 7)] EXCEPT !.a = LET b9207 == (CASE TRUE -> -1 [] OTHER -> -1 \div (CHOOSE b9208 \in 2..1 : TRUE)) IN (CASE TRUE -> 3 [] OTHER -> b9207 - (3 % b9207))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05972 failed.
    Attempted to select field "a" from a non-record value 1..3
    line 14, col 73 to line 14, col 80 of module random_05972
---*)

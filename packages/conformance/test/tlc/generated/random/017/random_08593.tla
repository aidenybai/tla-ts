(*---
description: Evaluates a random set expression, seed 262, number 8593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (\E b13314 \in DOMAIN <<1, 2>> : (b13314 < FALSE)) -> (Cardinality(1..3) % Head(<<1, 2>>)) [] OTHER -> CASE (~FALSE) -> (2 % 3) [] OTHER -> Head(<<>>), ([b13315 \in {b13316 \in {2, 1, 3} : TRUE} |-> (b13315 \div b13315)])[([[a |-> 1] EXCEPT !.a = @ + 7]).a]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08593 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
---*)

(*---
description: Evaluates a random record expression, seed 262, number 2988.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02988 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(-1 \in {2, 1, 3}) EXCEPT !.a = @ + (2147483647 \div 0)] EXCEPT !.a = @ + ((7 :> [a |-> 1]))[Head(<<1>>)]] EXCEPT !.a = @ + (CHOOSE b4745 \in ((2147483647 % 7) \cup DOMAIN <<5, 6>>) : (DOMAIN [x \in 1..2 |-> x] = (1..3 \cup 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02988 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)

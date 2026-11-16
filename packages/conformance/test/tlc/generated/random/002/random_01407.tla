(*---
description: Evaluates a random bool expression, seed 262, number 1407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail(Append(<<1>>, 7)) \o Tail((<<>> \o <<1, 2>>))) = [[b2236 \in ({x \in 1..3 : x > 1} \cap 1) |-> (CHOOSE b2237 \in 2..1 : FALSE)] EXCEPT ![CASE (\E b2238 \in {1} : TRUE) -> [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] [] OTHER -> (7 * {})] = CASE (TRUE => TRUE) -> (0 \div 2147483647) [] OTHER -> ([a |-> 1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01407 failed.
    Attempted to check if the value:
    2
    is an element of the integer 1
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 3953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b6220 \in {3 : b6221 \in {x \in 1..3 : x > 1}} : ({1, 2} \subseteq {x \in 1..3 : x > 1})} = {CASE TRUE -> 0 [] OTHER -> 0, ([a |-> 1, b |-> TRUE]).a}) \/ (((-1 .. 2) = UNION {{}, {x \in 1..3 : x > 1}}) <=> ((<<1, 2>> \o <<1, 2>>) \o <<1, 2147483647>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03953 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 174 to line 14, col 269 of module random_03953
---*)

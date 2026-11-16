(*---
description: Evaluates a random record expression, seed 262, number 1600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((-1 \o <<3, 1, 2>>) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) -> LET b2557 == ([a |-> 1, b |-> TRUE] \div 7) IN (0 \div b2557) [] OTHER -> ((1 + 2) - ([a |-> 1, b |-> TRUE]).a), b |-> (Head((<<>> \o <<1, 2>>)) = (({1, 2} \subseteq 2..1) * CASE TRUE -> 7 [] OTHER -> 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01600 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
---*)

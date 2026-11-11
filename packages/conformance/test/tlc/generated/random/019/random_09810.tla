(*---
description: Evaluates a random record expression, seed 262, number 9810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE (\A b15227 \in ({1} \cup {1, 2}) : (Nat = {x \in 1..3 : x > 1})) -> (CHOOSE r \in [a : {}] : TRUE) [] OTHER -> ((-2) + (-1 \div 1)), b |-> ((~(\A b15228 \in Nat : TRUE)) /\ (({x \in 1..3 : x > 1} \subseteq FALSE) <=> (\A b15229 \in 2..1 : <<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09810 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {2, 3}
---*)

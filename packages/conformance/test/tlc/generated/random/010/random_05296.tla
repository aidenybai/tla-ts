(*---
description: Evaluates a random function expression, seed 262, number 5296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8200 \in {b8201 \in (({} \cap {1, 2}) \cup (2147483647 \cap {1})) : ((CHOOSE r \in [a : 1..2] : TRUE) = [a |-> -1, b |-> TRUE])} |-> Head([Append(<<>>, b8200) EXCEPT ![1] = CASE FALSE -> b8200 [] OTHER -> 1])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05296 failed.
    Attempted to check if the value:
    1
    is an element of the integer 2147483647
---*)

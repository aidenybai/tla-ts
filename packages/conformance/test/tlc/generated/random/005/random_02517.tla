(*---
description: Evaluates a random set expression, seed 262, number 2517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-Head(<<1>>)) : b3970 \in (DOMAIN <<5, 6>> \cap (CHOOSE r \in [a : {0} \cup {1}] : TRUE))} \ DOMAIN [b3971 \in UNION {{}, {}} |-> CASE TRUE -> 1 [] OTHER -> 7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02517 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 0]
---*)

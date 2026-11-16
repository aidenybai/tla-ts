(*---
description: Evaluates a random bool expression, seed 262, number 29.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00029 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b45 \in {((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a : b46 \in UNION {{b47 \in {} : TRUE}, (-1 .. 2147483647)}} : ((([a |-> 1]).a - [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b45]) = ((b45 \div b45) .. (b45 % b45)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00029 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)

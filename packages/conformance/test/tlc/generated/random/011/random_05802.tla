(*---
description: Evaluates a random bool expression, seed 262, number 5802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 % -1) \div (3 + 2147483647)) * [a |-> ((1 :> 2))[[a |-> 1, b |-> TRUE]], b |-> (FALSE <=> FALSE)]) < (CHOOSE b8947 \in (({1, 2} \ {2, 1, 3}) \cap (Nat \cup {2, 1, 3})) : (~(FALSE \/ b8947)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

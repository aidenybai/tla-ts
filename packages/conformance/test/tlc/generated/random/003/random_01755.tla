(*---
description: Evaluates a random bool expression, seed 262, number 1755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(7 * 1), Head(<<1>>)} \subseteq {CASE TRUE -> 2147483647 [] OTHER -> 7, IF TRUE THEN 3 ELSE 2147483647}) \/ (UNION {{b2792 \in 2..1 : TRUE}, (7 \cap {x \in 1..3 : x > 1})} = UNION {([a |-> 1] \ {2, 1, 3}), (2..1 \ 2147483647)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01755 failed.
    Attempted to check if the value:
    2
    is an element of the integer 7
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(3 + 2), (-1 % 2)} \cap {b948 \in {b949 \in {1, 2} : FALSE} : (1..3 \subseteq 2..1)}) = {b950 \in {IF TRUE THEN <<5, 6>> ELSE 0, CASE FALSE -> 2147483647 [] OTHER -> 2} : ((b950 % 2) \in (b950 .. TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00561 failed.
    Attempted to compare integer 2 with non-integer:
    <<5, 6>>
---*)

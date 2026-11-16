(*---
description: Evaluates a random set expression, seed 262, number 6378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CASE (b9805 = 7) -> (TRUE \/ TRUE) [] OTHER -> LET b9806 == 7 IN 1 \div (CASE FALSE -> 1 [] OTHER -> b9805 % Head(<<1, 2>>))) : b9805 \in UNION {((1..3 \ {}) \cap ({x \in 1..3 : x > 1} \ 1..3)), {Len(<<>>) : b9807 \in ({2, 1, 3} \cup SUBSET {1})}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06378 failed.
    Attempted to compare the set {} with the value:
    2
---*)

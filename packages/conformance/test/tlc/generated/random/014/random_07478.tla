(*---
description: Evaluates a random set expression, seed 262, number 7478.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07478 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({1} \ 1..3) \cup (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE)) \cup {(2 \div 3), ([x \in 1..2 |-> x])[7]}), (UNION {{b11522 : b11522 \in {x \in 1..3 : x > 1}}, {b11523 : b11523 \in {x \in 1..3 : x > 1}}} \cup ((2147483647 % 7) .. (FALSE + -1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07478 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)

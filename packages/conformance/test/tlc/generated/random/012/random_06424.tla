(*---
description: Evaluates a random bool expression, seed 262, number 6424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(CASE FALSE -> 0 [] OTHER -> 7 \div (7 * 7)), LET b9888 == (2147483647 \div 1) IN ([x \in 1..2 |-> x])[3]>> = [(CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(-(2 % 3))] = IF (2147483647 < 2) THEN (2 % 2147483647) ELSE ([a |-> 1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06424 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)

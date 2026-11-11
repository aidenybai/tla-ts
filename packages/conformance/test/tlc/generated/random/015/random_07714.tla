(*---
description: Evaluates a random bool expression, seed 262, number 7714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(2 - b11899) : b11899 \in (1..3 \cup 1..3)} \cup (LET b11900 == 1 IN 2147483647 .. ([x \in 1..2 |-> x])[2147483647])) \subseteq {((SUBSET {1} \subseteq 2..1) - CASE FALSE -> 7 [] OTHER -> 7) : b11901 \in ((2 * 2147483647) .. (-1 % 1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07714 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)

(*---
description: Evaluates a random int expression, seed 262, number 1705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2720 == (CHOOSE b2721 \in (DOMAIN [x \in Nat |-> x + 1] \cup (<<1>> \o <<1>>)) : ((2 + 2147483647) = IF FALSE THEN -1 ELSE 1)) IN (LET b2722 == (3 % 0) IN Len(<<1, 2>>) \div LET b2723 == ([x \in 1..2 |-> x])[-1] IN LET b2724 == 3 IN b2723))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01705 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)

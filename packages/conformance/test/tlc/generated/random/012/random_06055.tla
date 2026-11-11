(*---
description: Evaluates a random set expression, seed 262, number 6055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x]).a * LET b9329 == -1 IN b9329) \div (Head(<<1>>) + (7 + -1))) .. CASE (\E b9330 \in DOMAIN [x \in 1..2 |-> x] : (FALSE /\ FALSE)) -> LET b9331 == (1 * 7) IN Len(<<3, 1, 2>>) [] OTHER -> Head((<<1, 2>> \o <<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06055 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)

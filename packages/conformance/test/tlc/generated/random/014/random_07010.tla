(*---
description: Evaluates a random bool expression, seed 262, number 7010.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07010 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10743 \in Head(Append((<<>> \o <<1>>), (0 + 3))) : (({2147483647, 2147483647} \ (2147483647 .. b10743)) \subseteq ({b10744 \in 2..1 : FALSE} \ DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07010 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    line 14, col 31 to line 14, col 68 of module random_07010
---*)

(*---
description: Evaluates a random int expression, seed 262, number 1318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-IF ((<<>> \o <<1>>) \ UNION {Nat, 1..3}) THEN ((CHOOSE r \in [a : 2..1] : TRUE)).a ELSE ((0 * 1) \div (7 + 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01318 failed.
    A non-boolean expression (a set of the form S \ T) was used as the condition of an IF.
    line 14, col 18 to line 14, col 127 of module random_01318
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 7900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b12192 \in UNION {[a |-> (7 % 3), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])], ({b12193 : b12193 \in <<1>>} \cup (2 .. 0))} : ((-CASE <<5, 6>> -> b12192 [] OTHER -> 0) \in {(0 \div b12192), Head(<<3, 1, 2>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07900 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 120 to line 14, col 124 of module random_07900
---*)

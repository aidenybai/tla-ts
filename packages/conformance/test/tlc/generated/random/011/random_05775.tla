(*---
description: Evaluates a random record expression, seed 262, number 5775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (((\E b8899 \in {2, 1, 3} : FALSE)).a \div (CASE FALSE -> 1 [] OTHER -> 1 % Cardinality(2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05775 failed.
    Attempted to select field "a" from a non-record value FALSE
    line 14, col 68 to line 14, col 103 of module random_05775
---*)

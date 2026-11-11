(*---
description: Evaluates a random set expression, seed 262, number 2713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CASE ({1} \subseteq SUBSET {1}) -> Len(<<3, 1, 2>>) [] OTHER -> ([a |-> 1]).a :> ((7 * 2147483647) * (-1 % [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02713 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)

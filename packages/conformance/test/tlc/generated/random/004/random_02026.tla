(*---
description: Evaluates a random int expression, seed 262, number 2026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF Len([(CHOOSE f \in [{1, 2} -> {1}] : TRUE) EXCEPT ![(-1 % -1)] = (3 + 1)]) THEN (Len([<<1>> EXCEPT ![1] = -1]) - (\A b3216 \in ({2, 1, 3} \ Nat) : (\A b3217 \in {} : TRUE))) ELSE (((7 \div 1) .. ([a |-> 1]).a) * (Len(<<3, 1, 2>>) \div (FALSE \ 1..3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02026 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

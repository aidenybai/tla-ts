(*---
description: Evaluates a random int expression, seed 262, number 609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b1020 \in {FALSE, [a |-> 1]} |-> (CHOOSE b1021 \in Nat : b1021)] EXCEPT ![Len(Tail(<<1, 2>>))] = ((2147483647 + 1) \div (7 \div 7))])[LET b1022 == ([b1023 \in {} |-> 2])[(-2147483647)] IN Len([<<3, 1, 2>> EXCEPT ![1] = <<3, 1, 2>>])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00609 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    1
---*)

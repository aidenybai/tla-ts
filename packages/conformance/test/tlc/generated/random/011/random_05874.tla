(*---
description: Evaluates a random int expression, seed 262, number 5874.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05874 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 0], LAMBDA e : e > 0) -> Head(<<-1, 7>>) [] OTHER -> ((7 % 0) \div ([a |-> 1]).a) % (-IF (FALSE /\ TRUE) THEN (3 \div 0) ELSE (<<5, 6>>)[3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05874 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 22 to line 14, col 79 of module random_05874
---*)

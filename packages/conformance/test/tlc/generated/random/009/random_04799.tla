(*---
description: Evaluates a random int expression, seed 262, number 4799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<(<<5, 6>>)[7], CASE 2 -> TRUE [] OTHER -> 2>> \o (SubSeq(<<>>, 1, 3) \o Tail(<<>>))) \o Tail(<<IF FALSE THEN 1 ELSE -1, Head(<<1>>)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04799 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)

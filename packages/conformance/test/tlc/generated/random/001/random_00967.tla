(*---
description: Evaluates a random seq expression, seed 262, number 967.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00967 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) => ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) -> (-Len(<<1>>)) [] OTHER -> ((2 \div 2) % Head(<<1, 2>>)), Head([a |-> ([x \in 1..2 |-> x])[7], b |-> (FALSE => FALSE)])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00967 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a record.
    line 14, col 24 to line 14, col 114 of module random_00967
---*)

(*---
description: Evaluates a random seq expression, seed 262, number 2585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<LET b4072 == ([a |-> 1, b |-> TRUE]).a IN LET b4073 == 3 IN [a |-> 1, b |-> TRUE], ((7 % 0) - IF TRUE THEN 2 ELSE 0)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)

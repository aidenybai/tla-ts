(*---
description: Evaluates a random set expression, seed 262, number 5060.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05060 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (~({x \in 1..3 : x > 1} = {})) -> Head(Append(<<1>>, 3)) [] OTHER -> ((<<5, 6>>)[-1] - LET b7870 == 7 IN SUBSET {1}), (Head((<<3, 1, 2>> \o <<1, 2>>)) * IF (\A b7871 \in 1..3 : TRUE) THEN Head([a |-> 1]) ELSE IF <<5, 6>> THEN 2147483647 ELSE 2147483647)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)

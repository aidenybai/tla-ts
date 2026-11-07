(*---
description: Evaluates a random set expression, seed 262, number 7482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (\E b11532 \in UNION {<<1, 2>>, 1..3} : (TRUE \/ FALSE)) -> [[(1 :> 2) EXCEPT ![3] = <<5, 6>>] EXCEPT ![IF FALSE THEN b11531 ELSE -1] = (b11531 % 2)] [] OTHER -> (Len(<<1, 2>>) - (b11531 - b11531)) : b11531 \in Tail(<<(-7), (-1 % -1)>>)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

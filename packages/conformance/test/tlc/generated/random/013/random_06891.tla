(*---
description: Evaluates a random int expression, seed 262, number 6891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{} -> {}] : TRUE) EXCEPT ![(CASE FALSE -> 2147483647 [] OTHER -> 3 % CASE TRUE -> 0 [] OTHER -> 3)] = CASE (\E b10554 \in Nat : FALSE) -> (2 \div 0) [] OTHER -> (CHOOSE b10555 \in <<5, 6>> : FALSE)])[Head(SelectSeq(SubSeq(<<>>, 1, 3), LAMBDA e : e > 0))])
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

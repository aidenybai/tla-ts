(*---
description: Evaluates a random int expression, seed 262, number 5542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8572 == Head(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), ({} \div 2), (2147483647 % 1))) IN [[(FALSE @@ <<5, 6>>) EXCEPT ![IF FALSE THEN b8572 ELSE Nat] = (CHOOSE b8573 \in Nat : FALSE)] EXCEPT ![1] = (([x \in 1..2 |-> x])[1] % (b8572 \div b8572))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
---*)

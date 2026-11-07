(*---
description: Evaluates a random int expression, seed 262, number 9226.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09226 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((\E b14319 \in ({1, 2} \ 2..1) : ({1, 2} = {1, 2})) <=> (({} \subseteq {2, 1, 3}) => (TRUE \/ FALSE))) -> ((-(3 % -1)) - (IF FALSE THEN -1 ELSE 2 \div (2147483647 + 7))) [] OTHER -> ((CHOOSE b14320 \in DOMAIN [x \in 1..2 |-> x] : (TRUE \/ TRUE)) % Len(SortSeq(<<>>, LAMBDA p, q : p < q))))
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

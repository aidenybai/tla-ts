(*---
description: Evaluates a random seq expression, seed 262, number 8353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((3 % 0) * (CHOOSE b12927 \in {1} : TRUE)), (([x \in 1..2 |-> x] @@ {1, 2}))[(<<5, 6>>)[1]]>> \o ((Append(<<3, 1, 2>>, 2147483647) \o <<3, 2147483647>>) :> (CHOOSE b12928 \in DOMAIN (1 :> 2) : (TRUE => TRUE)))))
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

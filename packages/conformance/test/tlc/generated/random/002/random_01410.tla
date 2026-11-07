(*---
description: Evaluates a random set expression, seed 262, number 1410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b2242 \in SUBSET {1} : TRUE) % Head(<<1, 2>>)) = Cardinality(DOMAIN <<5, 6>>)) : b2241 \in UNION {((2 \div 0) .. (-7)), {LET b2244 == 1 IN -1 : b2243 \in (2 .. 3)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)

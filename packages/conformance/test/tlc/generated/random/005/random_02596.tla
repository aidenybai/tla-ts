(*---
description: Evaluates a random int expression, seed 262, number 2596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4093 == ((-Cardinality(2..1)) \div (CHOOSE b4094 \in {3, -1} : (FALSE => FALSE))) IN (CASE (FALSE /\ {1}) -> IF FALSE THEN 1 ELSE b4093 [] OTHER -> (b4093 % b4093) \div ([[a |-> 1] EXCEPT !.a = b4093]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02596 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)

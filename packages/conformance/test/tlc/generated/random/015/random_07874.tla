(*---
description: Evaluates a random seq expression, seed 262, number 7874.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07874 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((IF FALSE THEN SUBSET {1} ELSE -1 * Cardinality(2..1)) + ((3 % -1) \div ((1 :> 2))[2147483647])), [[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + LET b12157 == 3 IN b12157] EXCEPT !.a = @ + LET b12158 == Cardinality(2..1) IN ([a |-> 1, b |-> TRUE]).a]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07874 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)

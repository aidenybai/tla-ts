(*---
description: Evaluates a random seq expression, seed 262, number 4209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(LET b6614 == IF FALSE THEN 2147483647 ELSE -1 IN Head(<<1, 2>>) + IF (1 \in {2, 1, 3}) THEN (CHOOSE b6615 \in 1..3 : FALSE) ELSE LET b6616 == [a |-> 1, b |-> TRUE] IN TRUE), ([(2 :> 1) EXCEPT ![LET b6617 == 3 IN TRUE] = ([a |-> 1, b |-> TRUE]).a])[(CHOOSE b6618 \in {b6619 \in {} : [a |-> 1, b |-> TRUE]} : (\A b6620 \in SUBSET {1} : FALSE))]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04209 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 112 to line 14, col 140 of module random_04209
---*)

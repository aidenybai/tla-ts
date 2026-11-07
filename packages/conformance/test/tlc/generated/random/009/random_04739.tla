(*---
description: Evaluates a random seq expression, seed 262, number 4739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 7 ELSE 7 * Head([a |-> 1])) \div ((-7) % IF FALSE THEN 1 ELSE FALSE)) * CASE ((FALSE \/ FALSE) /\ ((1 :> 2) \/ TRUE)) -> IF (FALSE <=> {2, 1, 3}) THEN LET b7407 == {} IN 2147483647 ELSE (-7) [] OTHER -> (Cardinality(Nat) \div ([a |-> 1, b |-> TRUE]).a)))
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

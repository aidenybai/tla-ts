(*---
description: Evaluates a random seq expression, seed 262, number 9447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(LET b14662 == (<<5, 6>>)[[a |-> 1, b |-> TRUE]] IN Cardinality(Nat), LET b14663 == IF FALSE THEN 2 ELSE 2 IN DOMAIN <<5, 6>>, ((2 - -1) - (<<>> - -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09447 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)

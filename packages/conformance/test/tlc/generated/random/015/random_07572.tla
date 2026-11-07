(*---
description: Evaluates a random seq expression, seed 262, number 7572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append((<<3, 1, 2>> \o [a |-> 1]), (-1 \div 3))) \o Tail(((TRUE /\ TRUE) <=> ({x \in 1..3 : x > 1} \subseteq SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1]
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1]
---*)

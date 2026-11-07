(*---
description: Evaluates a random seq expression, seed 262, number 984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([(<<-1, 2>> \o ({1} \subseteq {2, 1, 3})) EXCEPT ![1] = (Head(<<1>>) % (-1 \div 2))], ((-([a |-> 1, b |-> TRUE]).a) + (([a |-> 1] + 3) - IF FALSE THEN 2147483647 ELSE 0)), Cardinality((DOMAIN <<5, 6>> \cup (1..3 \ 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    TRUE
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    TRUE
---*)

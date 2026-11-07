(*---
description: Evaluates a random seq expression, seed 262, number 6638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SubSeq([<<1, 2>> EXCEPT ![1] = 0], (Nat \cup 2..1), IF FALSE THEN 0 ELSE 3), LET b10186 == ([a |-> 1, b |-> TRUE]).a IN (2 - 3)) \o Tail(((\A b10187 \in {1} : TRUE) \o [<<3, 1, 2>> EXCEPT ![1] = -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    Nat
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    Nat
---*)

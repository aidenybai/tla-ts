(*---
description: Evaluates a random bool expression, seed 262, number 148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(Tail(<<1>>))) < {b227 \in {IF TRUE THEN FALSE ELSE 3, ([a |-> 1, b |-> TRUE]).a} : (DOMAIN <<5, 6>> \subseteq (7 .. b227))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)

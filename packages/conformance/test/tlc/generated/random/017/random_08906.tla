(*---
description: Evaluates a random seq expression, seed 262, number 8906.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08906 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13795 \in UNION {DOMAIN <<5, 6>>, {b13796 \in {} : FALSE}} |-> IF ({2, 1, 3} \subseteq 2..1) THEN ([a |-> 1, b |-> TRUE] \o <<1, 2>>) ELSE Head(<<3, 1, 2>>)] \o ((CHOOSE r \in [a : {1, 2}] : TRUE) = [a |-> LET b13797 == 7 IN 1, b |-> (3 \in SUBSET {1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08906 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)

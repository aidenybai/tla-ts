(*---
description: Evaluates a random bool expression, seed 262, number 9251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([x \in 1..2 |-> x])[0] \in (1..3 \cup 2..1)) THEN (CHOOSE b14361 \in ({1, 2} \cap SUBSET {1}) : ([a |-> 1] = {1})) ELSE Head(SubSeq(<<1, 2>>, 2147483647, 7)) \in ({([a |-> 1]).a, CASE FALSE -> 2 [] OTHER -> 3} \cup {(0 % -1), Len(<<>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09251 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)

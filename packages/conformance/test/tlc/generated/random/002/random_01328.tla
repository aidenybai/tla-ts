(*---
description: Evaluates a random set expression, seed 262, number 1328.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01328 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([[x \in 1..2 |-> x] EXCEPT ![b2129] = -1])[([a |-> 1, b |-> TRUE]).a] : b2129 \in {(b2130 % 1) : b2130 \in <<0, 2>>}} \ ((DOMAIN <<5, 6>> \cup (SUBSET {1} \cap {x \in 1..3 : x > 1})) \ ((3 .. 7) \cap (3 .. 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01328 failed.
    TLC encountered a non-enumerable quantifier bound
    <<0, 2>>.
    line 14, col 126 to line 14, col 133 of module random_01328
---*)

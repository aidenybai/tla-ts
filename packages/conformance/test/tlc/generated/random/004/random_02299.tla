(*---
description: Evaluates a random record expression, seed 262, number 2299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b3632 \in (UNION {{1, 2}, SUBSET {1}} \cap (0 .. 3)) : ([<<>> EXCEPT ![1] = b3632] => (b3632 = 0))), b |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = @ + (3 \div 2147483647)] = [[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02299 failed.
    Attempted to compare the set {} with the value:
    1
---*)

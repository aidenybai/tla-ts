(*---
description: Evaluates a random record expression, seed 262, number 6495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len(Append(<<1>>, 2)), b |-> [[[a |-> 1] EXCEPT !.a = 7] EXCEPT !.a = @ + IF FALSE THEN -1 ELSE 2147483647]] EXCEPT !.a = @ + (CHOOSE b9987 \in (({2, 1, 3} \ FALSE) \cup {b9988 \in {2, 1, 3} : TRUE}) : (([x \in 1..2 |-> x])[b9987] \in {b9989 \in {2, 1, 3} : FALSE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06495 failed.
    2178:0 Overflow when computing 7+2147483647
---*)

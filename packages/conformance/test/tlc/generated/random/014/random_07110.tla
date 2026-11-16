(*---
description: Evaluates a random bool expression, seed 262, number 7110.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07110 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b10920 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]) IN ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a = IF ((-1 < 3) => (-1 = TRUE)) THEN ({b10921 \in 1..3 : FALSE} = ({} \cap {})) ELSE (IF FALSE THEN 7 ELSE 0 % (-2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07110 failed.
    Attempted to check equality of integer -1 with non-integer:
    TRUE
---*)

(*---
description: Evaluates a random bool expression, seed 262, number 8422.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08422 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13036 \in [(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (IF TRUE THEN 0 ELSE 1 + IF FALSE THEN -1 ELSE 2)] : Len(SelectSeq(Append(<<1, 2>>, b13036), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08422 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1].
    line 14, col 31 to line 14, col 133 of module random_08422
---*)

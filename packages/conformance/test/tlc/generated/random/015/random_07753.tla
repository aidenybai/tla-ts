(*---
description: Evaluates a random int expression, seed 262, number 7753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(<<5, 6>> @@ FALSE) EXCEPT ![Len(<<3, 1, 2>>)] = (CHOOSE b11955 \in {1, 2} : FALSE)] EXCEPT ![(CHOOSE b11956 \in ([a |-> 1] \cap -1) : (<<1>> = [x \in Nat |-> x + 1]))] = IF ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) THEN (-1 * 2) ELSE (CHOOSE b11957 \in {1, 2} : FALSE)] + (((-1 * SUBSET {1}) % (-1 % [a |-> 1, b |-> TRUE])) \div (LET b11958 == <<1>> IN b11958 - (<<5, 6>>)[-1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07753 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
---*)

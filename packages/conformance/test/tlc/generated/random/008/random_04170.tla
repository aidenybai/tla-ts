(*---
description: Evaluates a random set expression, seed 262, number 4170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {UNION {{b6560 \in {1, 2} : TRUE}, Head(<<>>)}, {b6561 \in (1 .. -1) : (FALSE /\ FALSE)}} \cap (LET b6562 == (7 * 2147483647) IN Len(<<1, 2>>) \cap ((<<5, 6>>)[1] .. [a |-> 7, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04170 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)

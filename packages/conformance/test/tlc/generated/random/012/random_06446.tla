(*---
description: Evaluates a random bool expression, seed 262, number 6446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b9922 \in (UNION {{x \in 1..3 : x > 1}, SUBSET {1}} \cap (2 .. -1)) : ({b9923 \in 2..1 : TRUE} = (1..3 \cup SUBSET {1}))) \/ (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] => (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE)) <=> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] = [[a |-> 1] EXCEPT !.a = -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06446 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a record.
    line 14, col 148 to line 14, col 244 of module random_06446
---*)

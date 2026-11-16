(*---
description: Evaluates a random int expression, seed 262, number 5773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\A b8892 \in {2147483647, [a |-> 1]} : (\E b8893 \in 2..1 : FALSE)) -> IF ({} \subseteq 1..3) THEN LET b8894 == 3 IN -1 ELSE (<<5, 6>> @@ [x \in 1..2 |-> x]) [] OTHER -> {(-7) : b8895 \in {7, 0}} - (({2, TRUE} \cup ({1, 2} \cap {1, 2})) % (CHOOSE b8896 \in ({1, 2} \cup {2, 1, 3}) : ([a |-> 1] = [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05773 failed.
    Attempted to compare record:
    [a |-> 1]
    with non-record
    2147483647
---*)

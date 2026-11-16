(*---
description: Evaluates a random int expression, seed 262, number 2476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(LET b3891 == 2147483647 IN b3891 :> IF FALSE THEN 1 ELSE 2147483647) EXCEPT ![Head((\A b3892 \in <<>> : FALSE))] = (Len((1 :> 2)) \div CASE TRUE -> 7 [] OTHER -> TRUE)] @@ [b3893 \in {CASE TRUE -> b3894 [] OTHER -> 1 : b3894 \in (Nat \cup {1, 2})} |-> LET b3895 == (3 - b3893) IN ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02476 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 116 to line 14, col 119 of module random_02476
---*)

(*---
description: Evaluates a random int expression, seed 262, number 6740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append(Append(Nat, 0), LET b10326 == 0 IN b10326)) % CASE (\A b10327 \in ({1} \ 2..1) : (2147483647 \in <<5, 6>>)) -> (CHOOSE b10328 \in {b10329 \in {x \in 1..3 : x > 1} : b10329} : (FALSE <=> TRUE)) [] OTHER -> CASE (~TRUE) -> Cardinality({1}) [] OTHER -> (CHOOSE b10330 \in 2..1 : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06740 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    Nat
---*)

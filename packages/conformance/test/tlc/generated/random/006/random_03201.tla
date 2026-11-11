(*---
description: Evaluates a random seq expression, seed 262, number 3201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(CHOOSE b5085 \in (<<>> \cup {2, 1, 3}) : (\E b5086 \in {1, 2} : TRUE))) \div (Cardinality({2147483647, 7}) * ([<<1>> EXCEPT ![1] = 1] % ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03201 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    <<>>
    are not both enumerable
---*)

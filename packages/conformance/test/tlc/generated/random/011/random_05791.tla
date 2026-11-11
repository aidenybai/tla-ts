(*---
description: Evaluates a random function expression, seed 262, number 5791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([b8928 \in {1 : b8929 \in 2..1} |-> (2147483647 \div TRUE)] @@ (CHOOSE f \in [{1} -> 2..1] : TRUE)) EXCEPT ![((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a] = ((Len(<<1, 2>>) .. [<<>> EXCEPT ![1] = -1]))[Len(SelectSeq(<<1>>, LAMBDA e : e > 0))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05791 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 82 to line 14, col 114 of module random_05791
---*)

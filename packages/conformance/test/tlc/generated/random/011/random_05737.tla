(*---
description: Evaluates a random seq expression, seed 262, number 5737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(CHOOSE b8840 \in {2147483647, -1} : (FALSE /\ FALSE)), [b8841 \in ({} \cup SUBSET {1}) |-> LET b8842 == b8841 IN 0]>>, (-(CHOOSE b8843 \in [[a |-> 1] EXCEPT !.a = 2] : (\A b8844 \in 1..3 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05737 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 77 of module random_05737
---*)

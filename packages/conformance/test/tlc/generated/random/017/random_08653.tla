(*---
description: Evaluates a random seq expression, seed 262, number 8653.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08653 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((([[a |-> 1] EXCEPT !.a = @ + 7]).a :> (IF 1..3 THEN 2 ELSE 7 \div LET b13387 == 7 IN b13387)), (((7 + 2) .. IF TRUE THEN 7 ELSE 1) \cup ({7, 2} \cup ({1, 2} \ {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08653 failed.
    A non-boolean expression (a set of the form i..j) was used as the condition of an IF.
    line 14, col 63 to line 14, col 114 of module random_08653
---*)

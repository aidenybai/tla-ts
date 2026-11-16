(*---
description: Evaluates a random seq expression, seed 262, number 9809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF ((FALSE /\ FALSE) <=> (-1 \in {1})) THEN ((CHOOSE b15222 \in 1..3 : TRUE) % LET b15223 == 7 IN 7) ELSE [[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = (-1 * 7)], (([b15224 \in {1, 2} |-> b15224])[IF FALSE THEN 2 ELSE FALSE] \div LET b15225 == (2147483647 \div 0) IN (CHOOSE b15226 \in b15225 : [x \in 1..2 |-> x]))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09809 failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)

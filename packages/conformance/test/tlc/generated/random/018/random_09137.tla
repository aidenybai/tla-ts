(*---
description: Evaluates a random int expression, seed 262, number 9137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([[a |-> 1] EXCEPT !.a = -1] = [a |-> 2147483647, b |-> FALSE]) -> (CHOOSE b14189 \in DOMAIN [x \in Nat |-> x + 1] : (2 < 7)) [] OTHER -> (-LET b14190 == -1 IN 2147483647) + (CHOOSE b14191 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) : ([b14192 \in 1..3 |-> -1] = (b14191 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09137 failed.
    Attempted to check equality of the function <<-1, -1, -1>> with the value:
    0..2147483647
---*)

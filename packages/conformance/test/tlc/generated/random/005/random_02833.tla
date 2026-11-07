(*---
description: Evaluates a random seq expression, seed 262, number 2833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((IF FALSE THEN 2147483647 ELSE 0 - (2147483647 * 7)) * (CHOOSE b4502 \in UNION {2..1, Nat} : (TRUE <=> TRUE))), Len(Append([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3], (<<5, 6>>)[-1]))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*7
    2178:0 Overflow when computing 2147483647*7
---*)

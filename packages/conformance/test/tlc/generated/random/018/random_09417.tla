(*---
description: Evaluates a random int expression, seed 262, number 9417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-([b14606 \in UNION {FALSE, 2..1} |-> (2147483647 \div 2147483647)])[(CASE FALSE -> 0 [] OTHER -> 0 - IF {1} THEN 0 ELSE 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09417 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 119 to line 14, col 147 of module random_09417
---*)

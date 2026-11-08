(*---
description: Evaluates a random set expression, seed 262, number 7640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (3 * 2147483647)]), (IF (SUBSET {1} = {1, 2}) THEN (1 % 0) ELSE IF FALSE THEN 0 ELSE -1 \div ((2147483647 \div 2) \div CASE TRUE -> 7 [] OTHER -> 3))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07640 failed.
    2178:0 Overflow when computing 3*2147483647
---*)

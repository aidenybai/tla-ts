(*---
description: Evaluates a random bool expression, seed 262, number 5837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF TRUE THEN 3 ELSE 7 % LET b8998 == 7 IN -1) * IF (<<1>> = (1 :> 2)) THEN ([a |-> 1]).a ELSE IF FALSE THEN 2147483647 ELSE 2147483647) < LET b8999 == ((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE))[CASE FALSE -> 1 [] OTHER -> 3] IN ([b9000 \in 2..1 |-> 7])[Head(<<3, 1, 2>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05837 failed.
    2178:0 Overflow when computing 3*2147483647
---*)

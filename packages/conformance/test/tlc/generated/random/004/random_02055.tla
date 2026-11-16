(*---
description: Evaluates a random set expression, seed 262, number 2055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{IF LET b3266 == FALSE IN 3 THEN (b3265 < b3265) ELSE ([x \in Nat |-> x + 1])[b3265] : b3265 \in ((1 + 2147483647) .. (CHOOSE b3267 \in {1} : FALSE))}, {b3268 \in {(2147483647 % 2147483647), (<<>> * 7)} : (<<b3268, -1>> = (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02055 failed.
    2178:0 Overflow when computing 1+2147483647
---*)

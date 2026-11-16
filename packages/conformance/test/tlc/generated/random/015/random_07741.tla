(*---
description: Evaluates a random set expression, seed 262, number 7741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b11942 \in SUBSET {1} : <<1, 2>>) - (1 + 7)) + Len(Tail(<<1>>))) .. IF (({1, 2} \cup SUBSET {1}) = UNION {SUBSET {1}, Nat}) THEN CASE (7 \in {}) -> (CHOOSE b11943 \in {1} : FALSE) [] OTHER -> (2147483647 + 7) ELSE CASE ({} = {x \in 1..3 : x > 1}) -> (0 \div 2147483647) [] OTHER -> Len(0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07741 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 20 to line 14, col 58 of module random_07741
---*)

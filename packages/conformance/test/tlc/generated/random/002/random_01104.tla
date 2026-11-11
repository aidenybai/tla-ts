(*---
description: Evaluates a random seq expression, seed 262, number 1104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE), ([b1758 \in {1} |-> -1])[([a |-> 1, b |-> TRUE]).a]>> EXCEPT ![1] = CASE (\E b1759 \in DOMAIN (1 :> 2) : (\A b1760 \in {x \in 1..3 : x > 1} : TRUE)) -> Cardinality({b1761 : b1761 \in TRUE}) [] OTHER -> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01104 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 251 to line 14, col 254 of module random_01104
---*)

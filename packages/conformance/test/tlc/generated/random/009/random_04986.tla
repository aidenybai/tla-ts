(*---
description: Evaluates a random int expression, seed 262, number 4986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (({0, 7} \cup (1..3 \cap SUBSET {1})) \subseteq ((CHOOSE b7763 \in SUBSET {1} : TRUE) .. Len(<<1>>))) THEN ((-(7 \div 2147483647)) + ([b7764 \in {} |-> -1])[[a |-> 0, b |-> <<>>]]) ELSE (CASE (\A b7765 \in 2..1 : FALSE) -> (0 \div 2147483647) [] OTHER -> (1 * 2) * Head((<<>> \o <<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04986 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)

(*---
description: Evaluates a random function expression, seed 262, number 2018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE) EXCEPT ![((2147483647 * -1) - CASE TRUE -> <<3, 1, 2>> [] OTHER -> [a |-> 1])] = (CHOOSE b3200 \in ({x \in 1..3 : x > 1} \cup {2, 1, 3}) : (SUBSET {1} \subseteq {1, 2}))] @@ (((-{x \in 1..3 : x > 1}) :> Cardinality({1})) @@ [(3 :> 0) EXCEPT ![(CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE)] = LET b3201 == 1 IN b3201])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 81 to line 14, col 81 of module random_02018 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | ExtendableExpr starting at line 14, column 69.
    | Expression starting at line 14, column 69.
    | ExtendableExpr starting at line 14, column 68.
    | Fatal errors while parsing TLA+ spec in file random_02018
    | In module random_02018
    | Could not parse module random_02018 from file random_02018.tla
    | *** Errors: 1
    | In module random_02018
    | Could not parse module random_02018 from file random_02018.tla
    3002:1 Parsing or semantic analysis failed.
---*)

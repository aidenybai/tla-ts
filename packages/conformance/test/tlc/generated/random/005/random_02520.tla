(*---
description: Evaluates a random set expression, seed 262, number 2520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Cardinality(SUBSET {1}), b |-> (TRUE <=> TRUE)]).a .. (CASE (3 = 2) -> (CHOOSE b3974 \in {} : FALSE) [] OTHER -> Cardinality(SUBSET {1}) + (([a |-> 1, b |-> TRUE]).a + (2147483647 * -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 205 to line 14, col 205 of module random_02520 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 194.
    | Expression starting at line 14, column 194.
    | ExtendableExpr starting at line 14, column 193.
    | ExtendableExpr starting at line 14, column 165.
    | Expression starting at line 14, column 165.
    | Fatal errors while parsing TLA+ spec in file random_02520
    | In module random_02520
    | Could not parse module random_02520 from file random_02520.tla
    | *** Errors: 1
    | In module random_02520
    | Could not parse module random_02520 from file random_02520.tla
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Evaluates a random int expression, seed 262, number 3109.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03109 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([a |-> 1]).a = (CHOOSE b4962 \in 1..3 : TRUE)) THEN ((CHOOSE b4963 \in [a |-> 1, b |-> TRUE] : TRUE) * Cardinality({1, 2})) ELSE (CASE TRUE -> 3 [] OTHER -> 0 + ({x \in 1..3 : x > 1} + 3)) - LET b4964 == CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> Head([x \in Nat |-> x + 1]) [] OTHER -> (-1 * -1) IN Len((<<3, 1, 2>> \o <<1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 326 to line 14, col 326 of module random_03109 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 324.
    | Expression starting at line 14, column 323.
    | ExtendableExpr starting at line 14, column 322.
    | Expression starting at line 14, column 322.
    | Case Other Arm starting at line 14, column 313.
    | Fatal errors while parsing TLA+ spec in file random_03109
    | In module random_03109
    | Could not parse module random_03109 from file random_03109.tla
    | *** Errors: 1
    | In module random_03109
    | Could not parse module random_03109 from file random_03109.tla
    3002:1 Parsing or semantic analysis failed.
---*)

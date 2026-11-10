(*---
description: Evaluates a random int expression, seed 262, number 4991.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04991 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(UNION {{2, 1, 3}, {x \in 1..3 : x > 1}}) - ((0 \div -1) % Len(<<1>>))) % ((CHOOSE b7772 \in (0 .. 7) : (1..3 = {1, 2})) + CASE (1 = 1) -> (CHOOSE b7773 \in {x \in 1..3 : x > 1} : FALSE) [] OTHER -> (CHOOSE b7774 \in 1..3 : TRUE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 77 to line 14, col 80 of module random_04991 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 75.
    | ExtendableExpr starting at line 14, column 74.
    | Expression starting at line 14, column 74.
    | ExtendableExpr starting at line 14, column 73.
    | Fatal errors while parsing TLA+ spec in file random_04991
    | In module random_04991
    | Could not parse module random_04991 from file random_04991.tla
    | *** Errors: 1
    | In module random_04991
    | Could not parse module random_04991 from file random_04991.tla
    3002:1 Parsing or semantic analysis failed.
---*)

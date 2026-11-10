(*---
description: Evaluates a random int expression, seed 262, number 6300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<((-1 * -1) % (2147483647 + 2147483647)), CASE (TRUE \/ FALSE) -> (3 + 2) [] OTHER -> Head(<<1>>)>>))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 28 to line 14, col 28 of module random_06300 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 26.
    | Expression starting at line 14, column 25.
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 24.
    | ExtendableExpr starting at line 14, column 23.
    | Fatal errors while parsing TLA+ spec in file random_06300
    | In module random_06300
    | Could not parse module random_06300 from file random_06300.tla
    | *** Errors: 1
    | In module random_06300
    | Could not parse module random_06300 from file random_06300.tla
    3002:1 Parsing or semantic analysis failed.
---*)

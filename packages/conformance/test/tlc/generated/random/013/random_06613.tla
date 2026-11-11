(*---
description: Evaluates a random bool expression, seed 262, number 6613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(LET b10145 == (1 * -1) IN Head(<<3, 1, 2>>) = ((-7) + Head(<<1>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 36 to line 14, col 36 of module random_06613 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 33.
    | Expression starting at line 14, column 33.
    | Definition starting at line 14, column 23.
    | Fatal errors while parsing TLA+ spec in file random_06613
    | In module random_06613
    | Could not parse module random_06613 from file random_06613.tla
    | *** Errors: 1
    | In module random_06613
    | Could not parse module random_06613 from file random_06613.tla
    3002:1 Parsing or semantic analysis failed.
---*)

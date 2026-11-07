(*---
description: Evaluates a random set expression, seed 262, number 6217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((-0) * (7 \div -1)) % (Head(<<3, 1, 2>>) \div Len(<<>>))), Cardinality(UNION {(2 .. 1), (0 \cup {})})})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 29 to line 14, col 32 of module random_06217 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 27.
    | Expression starting at line 14, column 27.
    | ExtendableExpr starting at line 14, column 26.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_06217
    | In module random_06217
    | Could not parse module random_06217 from file random_06217.tla
    | *** Errors: 1
    | In module random_06217
    | Could not parse module random_06217 from file random_06217.tla
    3002:1 Parsing or semantic analysis failed.
---*)

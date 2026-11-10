(*---
description: Evaluates a random int expression, seed 262, number 2666.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02666 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 * 3) - Head(0)) - Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) - ([a |-> (<<1, 2>> * -1), b |-> (TRUE \/ TRUE)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 107 to line 14, col 107 of module random_02666 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | Field Value starting at line 14, column 91.
    | Fatal errors while parsing TLA+ spec in file random_02666
    | In module random_02666
    | Could not parse module random_02666 from file random_02666.tla
    | *** Errors: 1
    | In module random_02666
    | Could not parse module random_02666 from file random_02666.tla
    3002:1 Parsing or semantic analysis failed.
---*)

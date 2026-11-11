(*---
description: Evaluates a random seq expression, seed 262, number 2076.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02076 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Append([<<>> EXCEPT ![1] = 1], (0 * -1)) \o (Tail(FALSE) \o SelectSeq(0, LAMBDA e : e > 0))) EXCEPT ![1] = (-((0 \div 1) - (-1 \div 7)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 52 to line 14, col 52 of module random_02076 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 50.
    | Expression starting at line 14, column 50.
    | ExtendableExpr starting at line 14, column 49.
    | Expression starting at line 14, column 49.
    | Optional Arguments starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_02076
    | In module random_02076
    | Could not parse module random_02076 from file random_02076.tla
    | *** Errors: 1
    | In module random_02076
    | Could not parse module random_02076 from file random_02076.tla
    3002:1 Parsing or semantic analysis failed.
---*)

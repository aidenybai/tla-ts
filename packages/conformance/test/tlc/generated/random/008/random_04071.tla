(*---
description: Evaluates a random seq expression, seed 262, number 4071.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(((3 - 7) % (-3)), ([a |-> 3, b |-> TRUE]).a) EXCEPT ![1] = ((Len(<<1>>) - (0 + -1)) + LET b6408 == (-1 * -1) IN (b6408 * <<5, 6>>))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 127 to line 14, col 127 of module random_04071 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 124.
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 123.
    | Definition starting at line 14, column 114.
    | Fatal errors while parsing TLA+ spec in file random_04071
    | In module random_04071
    | Could not parse module random_04071 from file random_04071.tla
    | *** Errors: 1
    | In module random_04071
    | Could not parse module random_04071 from file random_04071.tla
    3002:1 Parsing or semantic analysis failed.
---*)

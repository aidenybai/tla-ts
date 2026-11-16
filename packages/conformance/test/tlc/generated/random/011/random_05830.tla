(*---
description: Evaluates a random int expression, seed 262, number 5830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b8986 == (2 \div -1) IN CASE TRUE -> FALSE [] OTHER -> b8986 - ((0 + -1) + Len(<<1, 2>>))) \div (((2147483647 * 1) - IF FALSE THEN 7 ELSE 3) % (-(-7)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 34 to line 14, col 37 of module random_05830 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 32.
    | Expression starting at line 14, column 32.
    | ExtendableExpr starting at line 14, column 31.
    | Expression starting at line 14, column 31.
    | Definition starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_05830
    | In module random_05830
    | Could not parse module random_05830 from file random_05830.tla
    | *** Errors: 1
    | In module random_05830
    | Could not parse module random_05830 from file random_05830.tla
    3002:1 Parsing or semantic analysis failed.
---*)

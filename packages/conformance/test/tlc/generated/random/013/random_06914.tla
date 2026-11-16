(*---
description: Evaluates a random function expression, seed 262, number 6914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10579 \in ({LET b10581 == b10580 IN b10581 : b10580 \in (FALSE \cap {})} \cup ((0 - 2..1) .. (-1 \div -1))) |-> Len(Append(Append(b10579, b10579), (0 % 2147483647)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 115 to line 14, col 118 of module random_06914 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 113.
    | Expression starting at line 14, column 112.
    | ExtendableExpr starting at line 14, column 111.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | Fatal errors while parsing TLA+ spec in file random_06914
    | In module random_06914
    | Could not parse module random_06914 from file random_06914.tla
    | *** Errors: 1
    | In module random_06914
    | Could not parse module random_06914 from file random_06914.tla
    3002:1 Parsing or semantic analysis failed.
---*)

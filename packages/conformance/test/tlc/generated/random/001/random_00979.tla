(*---
description: Evaluates a random bool expression, seed 262, number 979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail(Append(<<>>, 0)) = (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)) => (((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a < ((<<1>> * 2) \div (2147483647 * -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 164 to line 14, col 164 of module random_00979 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 153.
    | Expression starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 152.
    | ExtendableExpr starting at line 14, column 135.
    | Expression starting at line 14, column 135.
    | Fatal errors while parsing TLA+ spec in file random_00979
    | In module random_00979
    | Could not parse module random_00979 from file random_00979.tla
    | *** Errors: 1
    | In module random_00979
    | Could not parse module random_00979 from file random_00979.tla
    3002:1 Parsing or semantic analysis failed.
---*)

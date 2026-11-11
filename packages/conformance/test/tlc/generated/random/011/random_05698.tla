(*---
description: Evaluates a random seq expression, seed 262, number 5698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<LET b8774 == (<<5, 6>>)[0] IN CASE FALSE -> b8774 [] OTHER -> b8774, (-(2147483647 \div -1))>> EXCEPT ![1] = Cardinality({Len(<<>>), Len(<<3, 1, 2>>)})])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 102 to line 14, col 105 of module random_05698 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 91.
    | Expression starting at line 14, column 91.
    | ExtendableExpr starting at line 14, column 90.
    | Expression starting at line 14, column 89.
    | ExtendableExpr starting at line 14, column 88.
    | Fatal errors while parsing TLA+ spec in file random_05698
    | In module random_05698
    | Could not parse module random_05698 from file random_05698.tla
    | *** Errors: 1
    | In module random_05698
    | Could not parse module random_05698 from file random_05698.tla
    3002:1 Parsing or semantic analysis failed.
---*)

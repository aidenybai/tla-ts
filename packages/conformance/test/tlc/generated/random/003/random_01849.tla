(*---
description: Evaluates a random seq expression, seed 262, number 1849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(Append(<<3, 3>>, (3 + 2147483647)), IF (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE) THEN ([a |-> 1, b |-> TRUE]).a ELSE (-1 \div -1)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 153 to line 14, col 156 of module random_01849 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 151.
    | Expression starting at line 14, column 150.
    | ExtendableExpr starting at line 14, column 149.
    | Expression starting at line 14, column 149.
    | IF THEN ELSE starting at line 14, column 67.
    | Fatal errors while parsing TLA+ spec in file random_01849
    | In module random_01849
    | Could not parse module random_01849 from file random_01849.tla
    | *** Errors: 1
    | In module random_01849
    | Could not parse module random_01849 from file random_01849.tla
    3002:1 Parsing or semantic analysis failed.
---*)

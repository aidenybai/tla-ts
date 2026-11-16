(*---
description: Evaluates a random set expression, seed 262, number 7210.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07210 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b11078 \in ((2147483647 * -1) .. <<2, 2>>) : (Append(<<1>>, b11078) = [b11079 \in {1} |-> 0])), Cardinality({Head(<<1>>), IF 3 THEN 0 ELSE 7})})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 49 to line 14, col 49 of module random_07210 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 38.
    | Expression starting at line 14, column 38.
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | ExtendableExpr starting at line 14, column 36.
    | Fatal errors while parsing TLA+ spec in file random_07210
    | In module random_07210
    | Could not parse module random_07210 from file random_07210.tla
    | *** Errors: 1
    | In module random_07210
    | Could not parse module random_07210 from file random_07210.tla
    3002:1 Parsing or semantic analysis failed.
---*)

(*---
description: Evaluates a random function expression, seed 262, number 7152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE) EXCEPT ![(((3 - 3) - (2 * -1)) \div LET b10991 == (2 * 1) IN (b10991 + 0))] = ((-(CHOOSE b10992 \in {} : TRUE)) - ([a |-> -1, b |-> FALSE]).a)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 89 to line 14, col 89 of module random_07152 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | Fatal errors while parsing TLA+ spec in file random_07152
    | In module random_07152
    | Could not parse module random_07152 from file random_07152.tla
    | *** Errors: 1
    | In module random_07152
    | Could not parse module random_07152 from file random_07152.tla
    3002:1 Parsing or semantic analysis failed.
---*)

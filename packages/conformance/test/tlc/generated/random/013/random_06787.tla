(*---
description: Evaluates a random function expression, seed 262, number 6787.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06787 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1} -> 1..2] : TRUE) EXCEPT ![(((7 * <<3, 1, 2>>) - (0 * -1)) + (Cardinality(Nat) * (7 + 0)))] = ((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE) @@ (CHOOSE f \in [2..1 -> {}] : TRUE))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 87 to line 14, col 87 of module random_06787 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 85.
    | Expression starting at line 14, column 85.
    | ExtendableExpr starting at line 14, column 84.
    | ExtendableExpr starting at line 14, column 64.
    | Expression starting at line 14, column 64.
    | Fatal errors while parsing TLA+ spec in file random_06787
    | In module random_06787
    | Could not parse module random_06787 from file random_06787.tla
    | *** Errors: 1
    | In module random_06787
    | Could not parse module random_06787 from file random_06787.tla
    3002:1 Parsing or semantic analysis failed.
---*)
